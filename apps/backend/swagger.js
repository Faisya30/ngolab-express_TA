import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gamification API',
      version: '1.0.0',
      description: 'API untuk sistem gamifikasi dengan fitur points, missions, dan games',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/gamification',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        UserGamification: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: 'user-001' },
            points: { type: 'integer', example: 100 },
            memberLevel: { type: 'string', example: 'Bronze' },
            streakCount: { type: 'integer', example: 5 },
            lastCheckIn: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Game: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'game-001' },
            type: { type: 'string', example: 'wheel' },
            name: { type: 'string', example: 'Wheel of Fortune' },
            cost_points: { type: 'integer', example: 50 },
            reward_points: { type: 'integer', example: 100 },
            is_active: { type: 'boolean', example: true },
            config_data: { type: 'object', nullable: true }
          }
        },
        Mission: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'mission-001' },
            title: { type: 'string', example: 'Daily Login' },
            description: { type: 'string', example: 'Login hari ini' },
            rewardPoints: { type: 'integer', example: 10 },
            target: { type: 'integer', example: 1 },
            type: { type: 'string', example: 'daily' },
            icon: { type: 'string', nullable: true },
            status: { type: 'string', example: 'active' }
          }
        },
        UserMission: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'usermission-001' },
            userId: { type: 'string', example: 'user-001' },
            missionId: { type: 'string', example: 'mission-001' },
            status: { type: 'string', example: 'completed' },
            completedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        PointsHistory: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ph-001' },
            userId: { type: 'string', example: 'user-001' },
            points: { type: 'integer', example: 10 },
            description: { type: 'string', example: 'Check-in streak 1' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        GamePlay: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'gp-001' },
            userId: { type: 'string', example: 'user-001' },
            gameId: { type: 'string', example: 'game-001' },
            gameType: { type: 'string', example: 'wheel' },
            costPoints: { type: 'integer', example: 50 },
            rewardPoints: { type: 'integer', example: 100 },
            prizeLabel: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Pesan error' }
          }
        }
      }
    },
    paths: {
      '/users': {
        get: {
          summary: 'Ambil semua user gamifikasi',
          tags: ['Users'],
          responses: {
            200: {
              description: 'Berhasil',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserGamification'
                  }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        get: {
          summary: 'Ambil user by ID',
          tags: ['Users'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Berhasil' }
          }
        },
        put: {
          summary: 'Update user',
          tags: ['Users'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserGamification' }
              }
            }
          },
          responses: { 200: { description: 'Berhasil' } }
        }
      },
      '/users/{id}/add-points': {
        post: {
          summary: 'Tambah points untuk user',
          tags: ['Users'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    points: { type: 'integer' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Berhasil' } }
        }
      },
      '/users/{id}/checkin': {
        post: {
          summary: 'Check-in harian',
          tags: ['Users'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { 200: { description: 'Check-in berhasil' } }
        }
      }
    }
  }
};

export const swaggerSpec = swaggerJSDoc(options);