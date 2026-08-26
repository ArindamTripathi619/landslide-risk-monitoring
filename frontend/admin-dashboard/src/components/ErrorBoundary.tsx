import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: '100vh', bgcolor: '#0a0e17', p: 3,
        }}>
          <Card sx={{ maxWidth: 500, bgcolor: '#111827', border: '1px solid #1f2937' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <ErrorIcon sx={{ fontSize: 64, color: '#d32f2f', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  sx={{ borderColor: '#ff6f00', color: '#ff6f00' }}
                >
                  Try Again
                </Button>
                <Button
                  variant="contained"
                  onClick={this.handleReload}
                  sx={{ bgcolor: '#ff6f00', '&:hover': { bgcolor: '#e65100' } }}
                >
                  Reload Page
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
