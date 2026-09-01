"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jira_service_1 = require("../services/jira.service");
const router = (0, express_1.Router)();
// GET /api/jira/status
router.get('/status', (req, res) => {
    const config = (0, jira_service_1.getJiraConfig)();
    if (!config) {
        res.json({
            configured: false,
        });
        return;
    }
    res.json({
        configured: true,
        baseUrl: config.baseUrl,
        email: config.email,
    });
});
// GET /api/jira/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const config = (0, jira_service_1.getJiraConfig)();
        if (!config) {
            res.json({
                configured: false,
                error: 'Jira API credentials not configured. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in backend .env file.',
            });
            return;
        }
        const forceRefresh = req.query.refresh === 'true';
        const data = await (0, jira_service_1.fetchJiraDashboardData)(forceRefresh);
        res.json(data);
    }
    catch (error) {
        console.error('Jira API Route Error:', error);
        const statusCode = error.message?.includes('401') || error.message?.includes('authentication') ? 401 :
            error.message?.includes('403') || error.message?.includes('forbidden') ? 403 :
                error.message?.includes('429') || error.message?.includes('rate limit') ? 429 : 500;
        res.status(statusCode).json({
            configured: true,
            error: error.message || 'An unexpected error occurred while communicating with Jira.',
        });
    }
});
exports.default = router;
