import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectFiles, token, modelId, provider } = await req.json();

    if (!projectFiles || !Array.isArray(projectFiles)) {
      return NextResponse.json({ error: "Project files are required" }, { status: 400 });
    }

    // Analyze project structure
    const analysis = {
      totalFiles: projectFiles.length,
      fileTypes: {} as Record<string, number>,
      pythonFiles: [] as any[],
      djangoDetected: false,
      issues: [] as any[],
      suggestions: [] as string[],
    };

    // Count file types
    projectFiles.forEach((file: any) => {
      if (file.type === "file") {
        const ext = file.path.split(".").pop() || "unknown";
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

        // Detect Python files
        if (ext === "py") {
          analysis.pythonFiles.push(file);
        }

        // Detect Django
        if (file.name === "manage.py" || file.path.includes("settings.py")) {
          analysis.djangoDetected = true;
        }
      }
    });

    // Basic code analysis for Python files
    analysis.pythonFiles.forEach((file: any) => {
      const content = file.content || "";
      
      // Check for common issues
      if (content.includes("print(") && !content.includes("import")) {
        analysis.issues.push({
          file: file.path,
          line: 1,
          severity: "warning",
          message: "Consider adding proper imports",
        });
      }

      // Check for TODO comments
      const todoMatches = content.match(/# TODO:?.*/gi);
      if (todoMatches) {
        todoMatches.forEach((todo: string) => {
          analysis.issues.push({
            file: file.path,
            severity: "info",
            message: `Found TODO: ${todo}`,
          });
        });
      }

      // Check for syntax patterns
      if (content.includes("except:") && !content.includes("except Exception")) {
        analysis.issues.push({
          file: file.path,
          severity: "warning",
          message: "Bare except clause detected. Consider catching specific exceptions.",
        });
      }
    });

    // Django-specific checks
    if (analysis.djangoDetected) {
      analysis.suggestions.push("Django project detected! Make sure to run migrations.");
      analysis.suggestions.push("Consider using environment variables for SECRET_KEY");
      
      const settingsFile = projectFiles.find((f: any) => f.path.includes("settings.py"));
      if (settingsFile && settingsFile.content) {
        if (settingsFile.content.includes("DEBUG = True")) {
          analysis.issues.push({
            file: settingsFile.path,
            severity: "error",
            message: "DEBUG is set to True. This should be False in production!",
          });
        }
        
        if (!settingsFile.content.includes("ALLOWED_HOSTS")) {
          analysis.issues.push({
            file: settingsFile.path,
            severity: "warning",
            message: "ALLOWED_HOSTS not configured properly",
          });
        }
      }
    }

    // AI-powered deep analysis (if token provided)
    if (token && modelId && analysis.pythonFiles.length > 0) {
      try {
        const aiAnalysis = await analyzeWithAI(
          analysis.pythonFiles.slice(0, 5), // Limit to first 5 files
          token,
          modelId,
          provider
        );
        
        if (aiAnalysis.issues) {
          analysis.issues.push(...aiAnalysis.issues);
        }
        if (aiAnalysis.suggestions) {
          analysis.suggestions.push(...aiAnalysis.suggestions);
        }
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
      }
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to analyze project" 
    }, { status: 500 });
  }
}

async function analyzeWithAI(
  files: any[], 
  token: string, 
  modelId: string, 
  provider: string
) {
  const fileContents = files.map(f => 
    `File: ${f.path}\n\`\`\`python\n${f.content}\n\`\`\``
  ).join("\n\n");

  const prompt = `Analyze the following Python code files and identify:
1. Potential bugs or errors
2. Security vulnerabilities
3. Performance issues
4. Code quality improvements
5. Best practice violations

${fileContents}

Respond in JSON format:
{
  "issues": [{"file": "path", "severity": "error|warning|info", "message": "description"}],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

  if (provider === "huggingface") {
    const response = await fetch("https://api-inference.huggingface.co/models/" + modelId, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();
    return parseAIResponse(data);
  }

  // Add other providers as needed
  return { issues: [], suggestions: [] };
}

function parseAIResponse(data: any) {
  try {
    if (typeof data === "string") {
      const jsonMatch = data.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return { issues: [], suggestions: [] };
  } catch {
    return { issues: [], suggestions: [] };
  }
}
