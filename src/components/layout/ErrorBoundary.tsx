"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ExecutiveErrorState } from "@/components/polish/ExecutiveErrorState";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ExecutiveErrorState
          title={this.props.fallbackTitle ?? "Operational continuity preserved"}
          message={
            this.state.message
              ? `A view encountered an unexpected condition. ${this.state.message} Refresh to restore full intelligence services.`
              : "A view encountered an unexpected condition. Refresh to restore full intelligence services — demo-safe fallbacks remain active."
          }
          onRetry={() => {
            this.setState({ hasError: false, message: undefined });
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}
