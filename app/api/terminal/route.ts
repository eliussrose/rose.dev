import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { command, cwd } = await req.json();

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    // Security: Block dangerous commands
    const dangerousCommands = ["rm -rf", "del /f", "format", "mkfs", "dd if="];
    if (dangerousCommands.some(cmd => command.toLowerCase().includes(cmd))) {
      return NextResponse.json({ 
        error: "This command is not allowed for security reasons" 
      }, { status: 403 });
    }

    // Execute command with timeout; use provided cwd if valid string
    const execOptions: Parameters<typeof execAsync>[1] = {
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    };
    if (cwd && typeof cwd === "string") {
      execOptions.cwd = cwd;
    }

    const { stdout, stderr } = await execAsync(command, execOptions);

    const output = String(stdout || stderr || "Command executed successfully");

    return NextResponse.json({ 
      output: output.trim(),
      success: true 
    });

  } catch (error: any) {
    console.error("Terminal error:", error);
    
    return NextResponse.json({ 
      error: error.message || "Failed to execute command",
      output: error.stdout || error.stderr || ""
    }, { status: 500 });
  }
}
