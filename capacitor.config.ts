import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.sbjgames.app',
    appName: 'Pim Pam Pet',
    // ponytail: remote-URL shell — the app IS the hosted site; no bundled build, no offline
    webDir: 'mobile/www',
    server: {
        // TODO: set this to the real production URL (it lives on the Dokploy host, not in this repo)
        url: 'https://game.sbj-webservice.nl',
        cleartext: false,
    },
};

export default config;
