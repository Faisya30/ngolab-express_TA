# Gamification API Documentation

## Base URL
```
http://localhost:3000/api/gamification
```

## Endpoint Mapping

### USER GAMIFICATION

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/users` | GET | Ambil semua user gamifikasi | UserGamification |
| `/users/:id` | GET | Ambil user by user_id | UserGamification |
| `/users/:id` | PUT | Update data user | UserGamification |
| `/users/:id/add-points` | POST | Tambah points untuk user | UserGamification, PointsHistory |
| `/users/:id/checkin` | POST | Check-in harian | UserGamification, PointsHistory |

### MISSIONS

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/missions` | GET | Ambil semua mission | Missions |
| `/missions` | POST | Buat mission baru | Missions |
| `/missions/:id` | PUT | Update mission | Missions |
| `/missions/:id` | DELETE | Hapus mission | Missions |

### USER MISSIONS

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/user-missions` | GET | Ambil semua user mission | UserMissions |
| `/user-missions/complete` | POST | Selesaikan mission | UserMissions, Missions, UserGamification, PointsHistory |

### GAMES

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/games` | GET | Ambil semua game | Games |
| `/games` | POST | Buat game baru | Games |
| `/games/:id` | PUT | Update game | Games |
| `/games/:id` | DELETE | Hapus game | Games |
| `/games/play` | POST | Main game | Games, UserGamification, GamePlays, PointsHistory |

### POINTS HISTORY

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/points-history` | GET | Ambil semua riwayat poin | PointsHistory |

### GAME PLAYS

| Endpoint | Method | Description | Table |
|----------|--------|-------------|-------|
| `/game-plays` | GET | Ambil semua riwayat gameplay | GamePlays |

---

## Request & Response Examples

### GET /api/gamification/users
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "user_id": "user-001",
      "points": 150,
      "memberLevel": "Silver",
      "streakCount": 5,
      "lastCheckIn": "2026-06-08T10:30:00.000Z"
    }
  ]
}
```

### GET /api/gamification/users/:id
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": {
    "user_id": "user-001",
    "points": 150,
    "memberLevel": "Silver",
    "streakCount": 5,
    "lastCheckIn": "2026-06-08T10:30:00.000Z"
  }
}
```

### PUT /api/gamification/users/:id
**Request Body:**
```json
{
  "points": 200,
  "memberLevel": "Gold"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": {
    "user_id": "user-001",
    "points": 200,
    "memberLevel": "Gold",
    "streakCount": 5,
    "lastCheckIn": "2026-06-08T10:30:00.000Z"
  }
}
```

### POST /api/gamification/users/:id/add-points
**Request Body:**
```json
{
  "points": 50,
  "description": "Bonus referral"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": {
    "user_id": "user-001",
    "points": 200,
    "memberLevel": "Gold",
    "streakCount": 5,
    "lastCheckIn": "2026-06-08T10:30:00.000Z"
  }
}
```

### POST /api/gamification/users/:id/checkin
**Response:**
```json
{
  "success": true,
  "message": "Check-in berhasil",
  "data": {
    "user_id": "user-001",
    "points": 210,
    "memberLevel": "Gold",
    "streakCount": 6,
    "lastCheckIn": "2026-06-09T08:00:00.000Z"
  }
}
```

### GET /api/gamification/missions
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "id": "mission-001",
      "title": "Daily Login",
      "description": "Login hari ini",
      "rewardPoints": 10,
      "target": 1,
      "type": "daily",
      "icon": "fas fa-calendar-check",
      "status": "active"
    }
  ]
}
```

### POST /api/gamification/missions
**Request Body:**
```json
{
  "title": "Daily Login",
  "description": "Login hari ini untuk mendapatkan poin",
  "rewardPoints": 10,
  "target": 1,
  "type": "daily",
  "icon": "fas fa-calendar-check",
  "status": "active"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Mis berhasil dibuat",
  "data": {
    "id": "mission-001",
    "title": "Daily Login",
    "description": "Login hari ini untuk mendapatkan poin",
    "rewardPoints": 10,
    "target": 1,
    "type": "daily",
    "icon": "fas fa-calendar-check",
    "status": "active"
  }
}
```

### POST /api/gamification/user-missions/complete
**Request Body:**
```json
{
  "userId": "user-001",
  "missionId": "mission-001"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Mission berhasil diselesaikan",
  "data": {
    "userMission": {
      "id": "usermission-001",
      "userId": "user-001",
      "missionId": "mission-001",
      "status": "completed",
      "completedAt": "2026-06-08T12:00:00.000Z"
    },
    "userGamification": {
      "user_id": "user-001",
      "points": 220,
      "memberLevel": "Gold",
      "streakCount": 6,
      "lastCheckIn": "2026-06-09T08:00:00.000Z"
    }
  }
}
```

### GET /api/gamification/games
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "id": "game-001",
      "type": "wheel",
      "name": "Wheel of Fortune",
      "cost_points": 50,
      "reward_points": 100,
      "is_active": true,
      "config_data": {
        "segments": ["10", "20", "50", "100"]
      }
    }
  ]
}
```

### POST /api/gamification/games
**Request Body:**
```json
{
  "type": "wheel",
  "name": "Wheel of Fortune",
  "cost_points": 50,
  "reward_points": 100,
  "is_active": true,
  "config_data": {
    "segments": ["10", "20", "50", "100"]
  }
}
```
**Response:**
```json
{
  "success": true,
  "message": "Game berhasil dibuat",
  "data": {
    "id": "game-001",
    "type": "wheel",
    "name": "Wheel of Fortune",
    "cost_points": 50,
    "reward_points": 100,
    "is_active": true,
    "config_data": {
      "segments": ["10", "20", "50", "100"]
    }
  }
}
```

### POST /api/gamification/games/play
**Request Body:**
```json
{
  "userId": "user-001",
  "gameId": "game-001"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Game berhasil dimainkan",
  "data": {
    "gamePlay": {
      "id": "gameplay-001",
      "userId": "user-001",
      "gameId": "game-001",
      "gameType": "wheel",
      "costPoints": 50,
      "rewardPoints": 100,
      "prizeLabel": "Wheel of Fortune",
      "timestamp": "2026-06-08T14:00:00.000Z"
    },
    "userGamification": {
      "user_id": "user-001",
      "points": 270,
      "memberLevel": "Gold",
      "streakCount": 6,
      "lastCheckIn": "2026-06-09T08:00:00.000Z"
    },
    "pointsSpent": 50,
    "pointsWon": 100
  }
}
```

### GET /api/gamification/points-history
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "id": "ph-001",
      "userId": "user-001",
      "points": 10,
      "description": "Check-in streak 5",
      "createdAt": "2026-06-08T08:00:00.000Z"
    }
  ]
}
```

### GET /api/gamification/points-history?userId=user-001
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "id": "ph-001",
      "userId": "user-001",
      "points": 10,
      "description": "Check-in streak 5",
      "createdAt": "2026-06-08T08:00:00.000Z"
    }
  ]
}
```

### GET /api/gamification/game-plays
**Response:**
```json
{
  "success": true,
  "message": "Berhasil",
  "data": [
    {
      "id": "gameplay-001",
      "userId": "user-001",
      "gameId": "game-001",
      "gameType": "wheel",
      "costPoints": 50,
      "rewardPoints": 100,
      "prizeLabel": "Wheel of Fortune",
      "timestamp": "2026-06-08T14:00:00.000Z"
    }
  ]
}
```

---

## Error Response
```json
{
  "success": false,
  "message": "Pesan error"
}
```