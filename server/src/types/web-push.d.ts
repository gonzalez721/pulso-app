declare module 'web-push' {
  interface PushSubscription {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  interface VapidDetails {
    subject: string
    publicKey: string
    privateKey: string
  }

  interface SendNotificationResponse {
    statusCode: number
    body: string
    headers: Record<string, string>
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void
  function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: Record<string, unknown>
  ): Promise<SendNotificationResponse>

  export { setVapidDetails, sendNotification }
  export default { setVapidDetails, sendNotification }
}
