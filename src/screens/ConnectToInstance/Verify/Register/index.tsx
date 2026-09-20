import { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import HuntKHashAIExternal from "@/utils/HuntKHashAIExternal";
import uiStore from "@/store/UIStore";
import { PATHS } from "@/utils/paths";
import { useNavigation } from "@react-navigation/native";
import { IStatus } from "..";
import { IExternalConnection } from "../..";
import Telemetry from "@/utils/Telemetry";

interface RegisterProps {
    connectionUrl: string; // eg: http://192.168.1.100:3000/api/mobile
    registrationToken: string; // eg: 1234567890 - temporary registration token from Hunt-K-HaSh AI instance
    updateStatus: (status: IStatus) => void;
}

export default function Register({ connectionUrl, registrationToken, updateStatus }: RegisterProps) {
    const navigation = useNavigation();
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    const [state, setState] = useState<'waiting_for_registration' | 'awaiting_approval'>('waiting_for_registration');

    // Memoize the HuntKHashAIExternal instance to prevent recreation on every render
    // Pass through the registration token to the HuntKHashAIExternal instance so we can call registerDevice()
    const huntKHashAIExternal = useMemo(() => new HuntKHashAIExternal(connectionUrl, '', registrationToken), [connectionUrl, registrationToken]);

    useEffect(() => {
        async function registerWithInstance() {
            try {
                const registration = await huntKHashAIExternal.registerDevice();
                await uiStore.setToStorage('current_huntkhashai_external_connection', { token: registration.token, connectionUrl, platform: registration.platform });

                // Add to huntkhashai_external_connections for future use
                const connections = await uiStore.getFromStorage('huntkhashai_external_connections', []) as IExternalConnection[];
                connections.push({ token: registration.token, connectionUrl, platform: registration.platform });
                await uiStore.setToStorage('huntkhashai_external_connections', connections);
                Telemetry.logEvent(Telemetry.CUSTOM_EVENTS.ACTIONS.EXTERNAL_CONNECTION_ESTABLISHED);

                setDeviceToken(registration.token);
                setState('awaiting_approval');
            } catch (error) {
                console.error('Registration error:', error);
                updateStatus({
                    status: 'error',
                    message: !!error ? (error as Error)?.message : 'Failed to register device. Please try again.',
                });
            }
        }
        registerWithInstance();
    }, [huntKHashAIExternal, updateStatus]);

    useEffect(() => {
        if (state === 'awaiting_approval' && deviceToken) {
            async function checkApproval() {
                let attempts = 0;
                let isApproved = false;
                while (attempts <= 10) {
                    console.log('Checking approval', deviceToken, `${attempts}/10`);
                    isApproved = await huntKHashAIExternal.tokenIsApproved(deviceToken as string);
                    if (isApproved) {
                        updateStatus({
                            status: 'import',
                            message: 'Collecting instance data...',
                        });
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                // Broke out of loop due to max attempts without approval
                if (!isApproved) {
                    updateStatus({
                        status: 'error',
                        message: 'Failed to register or approve device. Please try again.',
                    });
                } else {
                    navigation.reset({
                        index: 0,
                        // @ts-ignore
                        routes: [{ name: PATHS.connect_to_instance, params: { page: 'import', params: { connectionUrl, deviceToken } } }],
                    });
                }
            }
            checkApproval();
        }
    }, [state, deviceToken, huntKHashAIExternal, updateStatus]);

    if (state === 'waiting_for_registration') {
        return (
            <View className="flex flex-col items-center justify-center gap-4">
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={{ textAlign: 'center' }} className="text-white text-lg">Registering your device...</Text>
                <Text style={{ textAlign: 'center' }} className="text-white text-sm">This may take a few seconds...</Text>
            </View>
        );
    }

    if (state === 'awaiting_approval') {
        return (
            <View className="flex flex-col items-center justify-center gap-4">
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={{ textAlign: 'center' }} className="text-white text-lg">Awaiting approval...</Text>
                <Text style={{ textAlign: 'center' }} className="text-white text-sm">Please approve the device in the Hunt-K-HaSh AI application...</Text>
            </View>
        );
    }

    return null;
}