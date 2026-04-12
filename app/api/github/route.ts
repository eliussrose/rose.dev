import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, token, repo, message, branch, files } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "GitHub token is required" }, { status: 400 });
    }

    switch (action) {
      case "list-repos":
        return await listRepositories(token);
      
      case "get-repo":
        return await getRepository(token, repo);
      
      case "get-contents":
        return await getContents(token, repo, branch);
      
      case "commit":
        return await commitChanges(token, repo, branch, message, files);
      
      case "create-branch":
        return await createBranch(token, repo, branch);
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("GitHub API error:", error);
    return NextResponse.json({ 
      error: error.message || "GitHub operation failed" 
    }, { status: 500 });
  }
}

async function listRepositories(token: string) {
  const response = await fetch("https://api.github.com/user/repos?per_page=100", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  const repos = await response.json();
  return NextResponse.json({ 
    repos: repos.map((r: any) => ({
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      url: r.html_url,
      defaultBranch: r.default_branch,
    }))
  });
}

async function getRepository(token: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Repository not found");
  }

  const data = await response.json();
  return NextResponse.json({ repo: data });
}

async function getContents(token: string, repo: string, path: string = "") {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch contents");
  }

  const contents = await response.json();
  
  // Recursively fetch all files
  const files = [];
  
  for (const item of contents) {
    if (item.type === "file") {
      // Fetch file content
      const fileResponse = await fetch(item.download_url);
      const content = await fileResponse.text();
      
      files.push({
        path: item.path,
        name: item.name,
        type: "file",
        content: content,
        sha: item.sha,
      });
    } else if (item.type === "dir") {
      files.push({
        path: item.path,
        name: item.name,
        type: "folder",
      });
    }
  }

  return NextResponse.json({ files });
}

async function commitChanges(
  token: string, 
  repo: string, 
  branch: string, 
  message: string, 
  files: any[]
) {
  // Get the latest commit SHA
  const refResponse = await fetch(
    `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error("Failed to get branch reference");
  }

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${repo}/git/blobs`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content,
            encoding: "utf-8",
          }),
        }
      );

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      };
    })
  );

  // Create tree
  const treeResponse = await fetch(
    `https://api.github.com/repos/${repo}/git/trees`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: blobs,
      }),
    }
  );

  const treeData = await treeResponse.json();

  // Create commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    }
  );

  const commitData = await commitResponse.json();

  // Update reference
  await fetch(
    `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    }
  );

  return NextResponse.json({ 
    success: true, 
    commitSha: commitData.sha 
  });
}

async function createBranch(token: string, repo: string, branchName: string) {
  // Get default branch SHA
  const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
    },
  });

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  const refResponse = await fetch(
    `https://api.github.com/repos/${repo}/git/refs/heads/${defaultBranch}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
      },
    }
  );

  const refData = await refResponse.json();

  // Create new branch
  const createResponse = await fetch(
    `https://api.github.com/repos/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      }),
    }
  );

  const createData = await createResponse.json();
  return NextResponse.json({ success: true, branch: createData });
}
