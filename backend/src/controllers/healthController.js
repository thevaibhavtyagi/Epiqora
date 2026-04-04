/**
 * Health Check Controller
 * Returns server status information
 */

export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
  });
};

export default {
  getHealth,
};
