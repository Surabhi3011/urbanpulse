import { Component, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render-time errors in a page subtree so one broken view can't
 * blank the whole app. Resets automatically on navigation via `key` in App.tsx. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UrbanPulse page error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message={this.state.error.message || "This page hit an unexpected error."}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
