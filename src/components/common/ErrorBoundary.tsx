import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NotFoundScreen } from './NotFoundScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.hash = '';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <NotFoundScreen
          title="حدث خطأ غير متوقع"
          message="واجه التطبيق مشكلة تقنية بسيطة أثناء معالجة المحتوى. انقر للعودة إلى الصفحة الرئيسية بأمان."
          isError={true}
          onGoHome={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
