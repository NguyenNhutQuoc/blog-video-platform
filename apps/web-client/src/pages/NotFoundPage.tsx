import { Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

export default function NotFoundPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" fontWeight={700} color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            component={Link}
            to="/"
            variant="contained"
            startIcon={<Home />}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
