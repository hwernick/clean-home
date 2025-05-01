import express from 'express';
import { SyncDataController } from '../controllers/SyncData.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all sync data for the authenticated user
router.get('/', SyncDataController.getAllData);

// Get specific sync data by key
router.get('/:key', SyncDataController.getData);

// Sync data with server
router.post('/sync', SyncDataController.syncData);

// Delete sync data
router.delete('/:key', SyncDataController.deleteData);

export default router; 