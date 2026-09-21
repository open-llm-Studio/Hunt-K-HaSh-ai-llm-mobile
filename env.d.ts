declare module '@env' {

  /**
   * Optional services. Each is a network call leaving the device, so all of
   * them stay off unless pointed at infrastructure you control.
   */
  export const SEARXNG_BASE_URL: string | undefined;
  export const SEARXNG_API_KEY: string | undefined;
  export const SEARXNG_API_HEADER: string | undefined;
  export const GEOLOCATION_API_URL: string | undefined;
  export const UPDATE_CHECK_URL: string | undefined;
}
