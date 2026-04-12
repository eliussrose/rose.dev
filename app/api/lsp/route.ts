/**
 * @copyright Copyright (c) 2026 Taskkora. All rights reserved.
 * @license AGPL-3.0
 * @description LSP API Route - Handles LSP requests from frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { LSPServerManager } from '@/app/lib/lsp/server-manager';
import { ConnectionStatus } from '@/app/lib/lsp/types';

// Global server manager instance
let serverManager: LSPServerManager | null = null;

/**
 * Initialize server manager
 */
function getServerManager(workspaceRoot: string): LSPServerManager {
  if (!serverManager) {
    serverManager = new LSPServerManager({
      workspaceRoot,
      debug: process.env.NODE_ENV === 'development',
    });

    // Setup event handlers
    serverManager.on('serverStart', (info) => {
      console.log('[LSP API] Server started:', info);
    });

    serverManager.on('serverStop', () => {
      console.log('[LSP API] Server stopped');
    });

    serverManager.on('serverError', (error) => {
      console.error('[LSP API] Server error:', error);
    });

    serverManager.on('statusChange', (status) => {
      console.log('[LSP API] Status changed:', status);
    });
  }

  return serverManager;
}

/**
 * POST /api/lsp - Handle LSP requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workspaceRoot, method, params } = body;

    if (!workspaceRoot) {
      return NextResponse.json(
        { error: 'workspaceRoot is required' },
        { status: 400 }
      );
    }

    const manager = getServerManager(workspaceRoot);

    switch (action) {
      case 'start': {
        if (manager.isServerRunning()) {
          return NextResponse.json({
            success: true,
            message: 'Server is already running',
            status: manager.getStatus(),
          });
        }

        const serverInfo = await manager.startServer();
        return NextResponse.json({
          success: true,
          serverInfo,
          status: ConnectionStatus.Connected,
        });
      }

      case 'stop': {
        await manager.stopServer();
        return NextResponse.json({
          success: true,
          message: 'Server stopped',
          status: ConnectionStatus.Disconnected,
        });
      }

      case 'status': {
        return NextResponse.json({
          success: true,
          isRunning: manager.isServerRunning(),
          status: manager.getStatus(),
        });
      }

      case 'request': {
        if (!manager.isServerRunning()) {
          return NextResponse.json(
            { error: 'Server is not running' },
            { status: 503 }
          );
        }

        if (!method) {
          return NextResponse.json(
            { error: 'method is required for request action' },
            { status: 400 }
          );
        }

        const result = await manager.sendRequest(method, params || {});
        return NextResponse.json({
          success: true,
          result,
        });
      }

      case 'notification': {
        if (!manager.isServerRunning()) {
          return NextResponse.json(
            { error: 'Server is not running' },
            { status: 503 }
          );
        }

        if (!method) {
          return NextResponse.json(
            { error: 'method is required for notification action' },
            { status: 400 }
          );
        }

        manager.sendNotification(method, params || {});
        return NextResponse.json({
          success: true,
          message: 'Notification sent',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[LSP API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lsp - Get server status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceRoot = searchParams.get('workspaceRoot');

    if (!workspaceRoot) {
      return NextResponse.json(
        { error: 'workspaceRoot query parameter is required' },
        { status: 400 }
      );
    }

    const manager = getServerManager(workspaceRoot);

    return NextResponse.json({
      success: true,
      isRunning: manager.isServerRunning(),
      status: manager.getStatus(),
    });
  } catch (error: any) {
    console.error('[LSP API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lsp - Stop server
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceRoot = searchParams.get('workspaceRoot');

    if (!workspaceRoot) {
      return NextResponse.json(
        { error: 'workspaceRoot query parameter is required' },
        { status: 400 }
      );
    }

    const manager = getServerManager(workspaceRoot);
    await manager.stopServer();

    return NextResponse.json({
      success: true,
      message: 'Server stopped',
    });
  } catch (error: any) {
    console.error('[LSP API] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
