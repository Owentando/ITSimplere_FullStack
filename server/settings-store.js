const pool = require("./db");

let settingsTablePromise;

function ensureSettingsTable() {
    if (!settingsTablePromise) {
        settingsTablePromise = pool.query(
            `CREATE TABLE IF NOT EXISTS user_settings (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                default_language TEXT NOT NULL DEFAULT 'javascript'
                    CHECK (default_language IN ('javascript', 'python', 'java', 'cpp', 'html')),
                autosave_delay_ms INTEGER NOT NULL DEFAULT 500
                    CHECK (autosave_delay_ms IN (500, 1000, 2000)),
                theme TEXT NOT NULL DEFAULT 'dark'
                    CHECK (theme IN ('dark', 'light')),
                notify_on_share BOOLEAN NOT NULL DEFAULT FALSE
            )`
        ).catch((error) => {
            settingsTablePromise = null;
            throw error;
        });
    }

    return settingsTablePromise;
}

async function getUserSettings(userId) {
    await ensureSettingsTable();
    await pool.query(
        "INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        [userId]
    );

    const result = await pool.query(
        `SELECT default_language, autosave_delay_ms, theme, notify_on_share
         FROM user_settings
         WHERE user_id = $1`,
        [userId]
    );

    return result.rows[0];
}

module.exports = {
    ensureSettingsTable,
    getUserSettings
};
