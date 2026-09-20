import { IStreamEvent } from "@/utils/AiProviders/baseOpenAILikeProvider";
import { GEOLOCATION_API_URL } from "@env";

export type ILocation = {
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    asn: string;
    query: string;
}

export default {
    id: 'getLocation',
    name: 'Get Location',
    description: 'Get your approximate location. This will return the city, state, and country. ',
    defaultEnabled: true,
    category: 'default',
    definition: {
        type: 'function',
        function: {
            name: 'get_location',
            description: 'Get the approximate location of the user.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    config: {},
    execute: async function (_args: unknown, streamEmitter?: (event: IStreamEvent, data: any) => void) {
        try {
            streamEmitter?.('report_status', 'Looking up your approximate location');
            const location = await this._getLocation();
            if (!location) return 'Approximated location not able to be determined';
            return JSON.stringify({ city: location?.city, state: location?.regionName, country: location?.country });
        } catch (error) {
            console.log('getLocationTool', error);
            return 'Error getting location';
        }
    },
    /**
     * Upstream resolved the device's location through an endpoint run by
     * Mintplex Labs, which meant the device's IP address was sent to a third
     * party whenever an agent asked where the user was. It now only calls a
     * service you configure, and does nothing when none is set.
     */
    _getLocation: async function (): Promise<ILocation | null> {
        if (!GEOLOCATION_API_URL) {
            console.log('No geolocation service is configured - skipping the lookup.');
            return null;
        }
        try {
            const location = await fetch(GEOLOCATION_API_URL);
            const data = await location.json();
            return data;
        } catch (error) {
            console.log('_getLocation', error);
            return null;
        }
    }
} as const;