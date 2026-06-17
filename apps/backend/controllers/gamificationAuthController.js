import { query } from '../config/db.js';
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
        console.log('[GAMIFICATION LOGIN] Calling membership API at:', `${MEMBERSHIP_API_URL}/login`);
        let membershipResponse;
        try {
            membershipResponse = await fetch(`${MEMBERSHIP_API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
        } catch (fetchError) {
            console.error('[GAMIFICATION LOGIN] Fetch error:', fetchError.message);
            return res.status(503).json({
                success: false,
                message: 'Tidak dapat terhubung ke layanan membership. Pastikan backend membership berjalan.'
            });
        }

        let membershipResult;
        try {
            membershipResult = await membershipResponse.json();
        } catch (jsonError) {
            console.error('[GAMIFICATION LOGIN] JSON parse error:', jsonError.message);
            return res.status(502).json({
                success: false,
                message: 'Response dari layanan membership tidak valid.'
            });
        }

        console.log('[DEBUG] membershipResult:', JSON.stringify(membershipResult, null, 2));

        if (!membershipResponse.ok || !membershipResult.success) {
            return res.status(401).json({
                success: false,
                message: membershipResult.message || membershipResult.error || 'Akun tidak ditemukan atau password salah'
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

        const isAffiliate = String(memberUser.role || '').toUpperCase() === 'MEMBER_AFFILIATE';
        let affiliateRows = [];
        try {
            affiliateRows = isAffiliate
                ? await query('SELECT referral_code FROM affiliate_networks WHERE user_id = ? LIMIT 1', [extractedUserId])
                : [];
        } catch (affError) {
            console.warn('[GAMIFICATION LOGIN] Warning: Failed to fetch affiliate data:', affError?.message);
            affiliateRows = [];
        }
        const referralCode = isAffiliate ? affiliateRows[0]?.referral_code || null : null;

        // Get or create UserGamification record
        let userGamification;
        try {
            userGamification = await UserGamificationService.getUserById(extractedUserId);
        } catch (ugError) {
            console.warn('[GAMIFICATION LOGIN] Warning: Failed to fetch UserGamification:', ugError?.message);
            userGamification = null;
        }

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
                    status: memberUser.status,
                    referral_code: referralCode
                },
                userGamification: userGamification
            }
        });
    } catch (error) {
        console.error('[GAMIFICATION LOGIN] Error:', error);
        if (error?.stack) {
            console.error('[GAMIFICATION LOGIN] Stack:', error.stack);
        }
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