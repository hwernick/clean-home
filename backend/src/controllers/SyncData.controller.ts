import { Request, Response } from 'express';
import { SyncData } from '../models/SyncData.model';

export class SyncDataController {
  // Get all sync data for a user
  static async getAllData(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const data = await SyncData.find({ userId });
      res.json(data);
    } catch (error) {
      console.error('Error fetching sync data:', error);
      res.status(500).json({ error: 'Failed to fetch sync data' });
    }
  }

  // Get specific sync data by key
  static async getData(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { key } = req.params;
      const data = await SyncData.findOne({ userId, key });
      
      if (!data) {
        return res.status(404).json({ error: 'Data not found' });
      }
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching sync data:', error);
      res.status(500).json({ error: 'Failed to fetch sync data' });
    }
  }

  // Sync data with server
  static async syncData(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { key, data, lastModified } = req.body;

      // Find existing data
      const existingData = await SyncData.findOne({ userId, key });

      if (existingData) {
        // Update if server data is older
        if (existingData.lastModified < lastModified) {
          existingData.data = data;
          existingData.lastModified = lastModified;
          await existingData.save();
        }
        res.json(existingData);
      } else {
        // Create new data
        const newData = await SyncData.create({
          userId,
          key,
          data,
          lastModified
        });
        res.json(newData);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      res.status(500).json({ error: 'Failed to sync data' });
    }
  }

  // Delete sync data
  static async deleteData(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { key } = req.params;
      
      const result = await SyncData.findOneAndDelete({ userId, key });
      
      if (!result) {
        return res.status(404).json({ error: 'Data not found' });
      }
      
      res.json({ message: 'Data deleted successfully' });
    } catch (error) {
      console.error('Error deleting sync data:', error);
      res.status(500).json({ error: 'Failed to delete sync data' });
    }
  }
} 