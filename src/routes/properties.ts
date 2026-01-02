import express from 'express';
import { prisma } from '../lib/prisma';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Save property
router.post('/:id/save', auth, async (req: AuthRequest, res) => {
  try {
    const { id: propertyId } = req.params;
    const userId = req.user.id;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Check if already saved
    const existingSaved = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existingSaved) {
      return res.status(400).json({
        success: false,
        error: 'Property already saved'
      });
    }

    // Save property
    const savedProperty = await prisma.savedProperty.create({
      data: {
        userId,
        propertyId
      },
      include: {
        property: true
      }
    });

    res.json({
      success: true,
      data: savedProperty
    });

  } catch (error) {
    console.error('Save property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save property'
    });
  }
});

// Get saved properties
router.get('/saved', auth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id;

    const savedProperties = await prisma.savedProperty.findMany({
      where: { userId },
      include: {
        property: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse JSON strings
    const formattedProperties = savedProperties.map(item => ({
      ...item,
      property: {
        ...item.property,
        amenities: JSON.parse(item.property.amenities || '[]'),
        images: JSON.parse(item.property.images || '[]')
      }
    }));

    res.json({
      success: true,
      count: formattedProperties.length,
      data: formattedProperties
    });

  } catch (error) {
    console.error('Get saved properties error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get saved properties'
    });
  }
});

// Remove saved property
router.delete('/saved/:id', auth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savedProperty = await prisma.savedProperty.findUnique({
      where: { id }
    });

    if (!savedProperty || savedProperty.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Saved property not found'
      });
    }

    await prisma.savedProperty.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Property removed from saved'
    });

  } catch (error) {
    console.error('Remove saved property error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove saved property'
    });
  }
});

export default router;