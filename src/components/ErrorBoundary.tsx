import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Log for diagnostics; never surface raw stack to the user.
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-5xl text-charcoal">Something went wrong</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We hit an unexpected error while loading this page. Please try again — if the issue
            persists, call us at{" "}
            <a href="tel:+919216400005" className="text-gold underline">
              +91 9216400005
            </a>
            .
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-charcoal px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-ivory transition hover:bg-gold"
            >
              Reload
            </button>
            <Link
              to="/"
              onClick={this.handleReset}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-charcoal transition hover:border-gold hover:text-gold"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}