import { UserGamificationService } from '../services/UserGamificationService.js';

const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL || 'http://localhost:4000/api/membership';

export async function gamificationLogin(req, res) {
    try {
        const { username, email, password } = req.body || {};
        const identifier = username || email;
        
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username/email dan password wajib diisi'
            });
        }

        // Call Membership API for authentication
        const membershipResponse = await fetch(`${MEMBERSHIP_API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const membershipResult = await membershipResponse.json();

        console.log('[DEBUG] membershipResult:', JSON.stringify(membershipResult, null, 2));

        if (!membershipResponse.ok || !membershipResult.success) {
            return res.status(401).json({
                success: false,
                message: membershipResult.message || 'Akun tidak ditemukan atau password salah'
            });
        }

        // Get user data from membership
        const memberUser = membershipResult.data?.user || membershipResult.user?.user || membershipResult.user;

        // Extract user_id with fallback support
        const extractedUserId = memberUser?.user_id || memberUser?.userId || memberUser?.id;

        console.log('[DEBUG] memberUser:', JSON.stringify(memberUser, null, 2));
        console.log('[DEBUG] memberUser.user_id:', extractedUserId);

        // Validate user_id before proceeding
        if (!extractedUserId) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengekstrak user_id dari response Membership API'
            });
        }

        // Get or create UserGamification record
        const userGamification = await UserGamificationService.getUserById(extractedUserId);

        return res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: {
                    user_id: extractedUserId,
                    username: memberUser.username,
                    email: memberUser.email,
                    membership_level: memberUser.membership_level,
                    role: memberUser.role,
                    status: memberUser.status
                },
                userGamification: userGamification
            }
        });
    } catch (error) {
        console.error('[GAMIFICATION LOGIN] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        });
    }
}

export async function gamificationProfile(req, res) {
    try {
        const user_id = String(req.params.user_id || '').trim();
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }

        // Verify user exists in Membership
        const membershipResponse = await fetch(`${MEMBERSHIP_API_URL}/profile/${user_id}`);
        const membershipResult = await membershipResponse.json();

        if (!membershipResponse.ok || !membershipResult.success) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan di Membership'
            });
        }

        const memberUser = membershipResult.data?.user || membershipResult.user?.user || membershipResult.user;
        const userGamification = await UserGamificationService.getUserById(user_id);

        // Extract user_id for response
        const responseUserId = memberUser?.user_id || memberUser?.userId || memberUser?.id;

        return res.json({
            success: true,
            message: 'Berhasil',
            data: {
                user: {
                    user_id: responseUserId || user_id,
                    username: memberUser?.username,
                    email: memberUser?.email,
                    membership_level: memberUser?.membership_level,
                    role: memberUser?.role,
                    status: memberUser?.status
                },
                userGamification: userGamification
            }
        });
    } catch (error) {
        console.error('[GAMIFICATION PROFILE] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        });
    }
}

export async function gamificationLookup(req, res) {
    try {
        const { user_id } = req.body || {};
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'user_id wajib diisi'
            });
        }

        // Verify user exists in Membership
        const membershipResponse = await fetch(`${MEMBERSHIP_API_URL}/lookup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id })
        });

        const membershipResult = await membershipResponse.json();

        if (!membershipResponse.ok || !membershipResult.success) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan di Membership'
            });
        }

        const memberUser = membershipResult.data?.user || membershipResult.user?.user || membershipResult.user;
        const userGamification = await UserGamificationService.getUserById(user_id);

        // Extract user_id for response
        const responseUserId = memberUser?.user_id || memberUser?.userId || memberUser?.id;

        return res.json({
            success: true,
            message: 'Berhasil',
            data: {
                user: {
                    user_id: responseUserId || user_id,
                    username: memberUser?.username,
                    email: memberUser?.email,
                    membership_level: memberUser?.membership_level,
                    role: memberUser?.role,
                    status: memberUser?.status
                },
                userGamification: userGamification
            }
        });
    } catch (error) {
        console.error('[GAMIFICATION LOOKUP] Error:', error.message);
        return res.status(500).json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        });
    }
}