import api from './client'
import { asesorApi } from './asesorClient'

interface SubData { endpoint: string; p256dh: string; auth: string }

export const pushApi = {
  subscribe:         (data: SubData)                    => api.post('/push/subscribe', data),
  unsubscribe:       (data: Pick<SubData, 'endpoint'>)  => api.delete('/push/subscribe', { data }),
  asesorSubscribe:   (data: SubData)                    => asesorApi.post('/push/subscribe', data),
  asesorUnsubscribe: (data: Pick<SubData, 'endpoint'>)  => asesorApi.delete('/push/subscribe', { data }),
}
