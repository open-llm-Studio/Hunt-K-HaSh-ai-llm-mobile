/**
 * Telemetry is disabled in Hunt-K-HaSh AI.
 *
 * Upstream logged usage events to Firebase Analytics - chats completed,
 * documents imported, workspaces created, onboarding answers, model settings -
 * with no way to opt out. Nothing about how this app is used leaves the device,
 * so events are dropped here instead of being sent anywhere.
 *
 * The call sites throughout the app are left in place on purpose: they document
 * what the product considers interesting, and keeping this shape means an
 * upstream port does not have to re-thread them.
 */
class Telemetry {
    private static instance: Telemetry;

    /**
     * Event names, kept so existing call sites keep type-checking. Nothing is
     * transmitted for any of them.
     */
    CUSTOM_EVENTS = {
        ONBOARDING: {
            COMPLETED: 'onboarding_completed',
            SURVEY_RESPONSE: 'onboarding_survey_response',
        },
        ACTIONS: {
            WORKSPACE_CREATED: 'workspace_created',
            CHAT_COMPLETED: 'chat_completed',
            /** The user pressed stop while a reply was generating - nothing was saved */
            CHAT_ABORTED: 'chat_aborted',
            DOCUMENT_IMPORTED: 'document_added',
            /** An image was attached to a prompt from the gallery or the camera */
            IMAGE_ATTACHED: 'image_attached',
            TOOL_CALLED: 'tool_called',
            LLM_SETTINGS_UPDATED: 'llm_settings_updated',
            /** A chat thread was exported (txt/md/json/pdf) and handed to the share sheet */
            THREAD_EXPORTED: 'thread_exported',
            /** A chat thread was forked into a new thread with a copy of its history */
            THREAD_FORKED: 'thread_forked',
            /** A user/assistant message pair was deleted from a thread */
            CHAT_DELETED: 'chat_deleted',
            /** A user/assistant message pair was removed and its prompt re-submitted */
            CHAT_RETRIED: 'chat_retried',

            /** The user used the QR code to connect to a Hunt-K-HaSh AI instance */
            EXTERNAL_CONNECTION_ESTABLISHED: 'external_connection_established',
            /** External workspace imported from Hunt-K-HaSh AI desktop */
            EXTERNAL_WORKSPACE_IMPORTED: 'external_workspace_imported',
        }
    } as const;

    constructor() {
        if (Telemetry.instance) return Telemetry.instance;
        Telemetry.instance = this;
    }

    /** Intentionally does nothing. */
    logEvent(_name: string, _params: Record<string, any> = {}) {
        return;
    }
}

const telemetry = new Telemetry();
export default telemetry;
