import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import {
  Box,
  CardContent,
  CardMedia,
  Typography,
  CardActions,
  Button,
} from '@mui/material';
import { Stack } from '@mui/material';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    elevation: {
      control: { type: 'range', min: 0, max: 24 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    elevation: 1,
    sx: { width: 345 },
    children: (
      <CardContent>
        <Typography variant="h5" component="div">
          Card Title
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is some sample content inside the card. Cards are surfaces that
          display content and actions on a single topic.
        </Typography>
      </CardContent>
    ),
  },
};

export const WithMedia: Story = {
  render: () => (
    <Card sx={{ width: 345 }}>
      <CardMedia
        component="img"
        height="140"
        image="https://picsum.photos/345/140"
        alt="Sample image"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          Media Card
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cards can include media like images or videos to create visual impact.
        </Typography>
      </CardContent>
    </Card>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card sx={{ width: 345 }}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          Action Card
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This card has action buttons at the bottom.
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Share</Button>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
  ),
};

export const Elevations: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      {[0, 1, 2, 4, 8].map((elevation) => (
        <Card key={elevation} elevation={elevation} sx={{ width: 100, p: 2 }}>
          <Typography variant="body2" textAlign="center">
            Elevation {elevation}
          </Typography>
        </Card>
      ))}
    </Stack>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" sx={{ width: 345, p: 2 }}>
      <Typography variant="h6">Outlined Card</Typography>
      <Typography variant="body2" color="text.secondary">
        This card uses the outlined variant instead of elevation.
      </Typography>
    </Card>
  ),
};

export const CompleteExample: Story = {
  render: () => (
    <Card sx={{ width: 345 }}>
      <CardMedia
        component="img"
        height="180"
        image="https://picsum.photos/345/180"
        alt="Blog post cover"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          Building Modern Web Apps
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Learn how to build scalable and maintainable web applications using
          React, TypeScript, and modern best practices.
        </Typography>
        <Box display="flex" gap={1}>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.5,
              bgcolor: 'primary.light',
              borderRadius: 1,
              color: 'primary.main',
            }}
          >
            React
          </Typography>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.5,
              bgcolor: 'secondary.light',
              borderRadius: 1,
              color: 'secondary.main',
            }}
          >
            TypeScript
          </Typography>
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button size="small" variant="contained">
          Read More
        </Button>
        <Button size="small">Share</Button>
      </CardActions>
    </Card>
  ),
};
