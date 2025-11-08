import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
} from 'axios'
import type { IAxiosRetryConfig } from 'axios-retry'
import axiosRetry from 'axios-retry'
import { z } from 'zod'
import { logger } from './logger'

class Http {
  private axios: AxiosInstance

  constructor(axiosConfig?: CreateAxiosDefaults) {
    const axiosInstance = axios.create({
      timeout: 5 * 1000, // default to 15 second timeout
      ...axiosConfig,
    })
    this.attachRetryLogic(axiosInstance)
    this.axios = axiosInstance
  }

  public async request<T>({
    schema,
    ...config
  }: AxiosRequestConfig & { schema: z.ZodType<T> }): Promise<T> // When schema is provided, return T
  public async request(config: AxiosRequestConfig): Promise<unknown> // When schema is NOT provided, return unknown
  public async request<T = unknown>({
    // Implementation signature (must be compatible with all overloads)
    schema,
    ...config
  }: AxiosRequestConfig & { schema?: z.ZodType<T> }): Promise<T | unknown> {
    const res = await this.axios.request(config)
    if (schema) {
      return schema.parse(res.data)
    }

    return z.unknown().parse(res.data)
  }

  public async get<T>(
    url: string,
    config: AxiosRequestConfig & { schema: z.ZodType<T> },
  ): Promise<T>
  public async get(url: string, config?: AxiosRequestConfig): Promise<unknown>
  public async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { schema?: z.ZodType<T> },
  ): Promise<T | unknown> {
    return this.request({ ...config, method: 'GET', url })
  }

  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema: z.ZodType<T> },
  ): Promise<T>
  public async post(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<unknown>
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema?: z.ZodType<T> },
  ): Promise<T | unknown> {
    return this.request({ ...config, method: 'POST', url, data })
  }

  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema: z.ZodType<T> },
  ): Promise<T>
  public async put(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<unknown>
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema?: z.ZodType<T> },
  ): Promise<T | unknown> {
    return this.request({ ...config, method: 'PUT', url, data })
  }

  public async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema: z.ZodType<T> },
  ): Promise<T>
  public async patch(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<unknown>
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & { schema?: z.ZodType<T> },
  ): Promise<T | unknown> {
    return this.request({ ...config, method: 'PATCH', url, data })
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig & { schema: z.ZodType<T> },
  ): Promise<T>
  public async delete(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<unknown>
  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig & { schema?: z.ZodType<T> },
  ): Promise<T | unknown> {
    return this.request({ ...config, method: 'DELETE', url })
  }

  /**
   * Mutates the given `axiosInstance` to retry on errors.
   * Still throws an `AxiosError` if the request fails after all retries
   */
  private attachRetryLogic(
    axiosInstance: AxiosInstance,
    retryConfig: IAxiosRetryConfig = {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    },
  ): void {
    axiosRetry(axiosInstance, {
      retries: retryConfig.retries,
      retryDelay: retryConfig.retryDelay,
      retryCondition: (err) => {
        // Retry on network errors (e.g. ECONNREFUSED)
        // or if the server failed to respond (status is undefined)
        const status = err.response?.status
        if (status === undefined || axiosRetry.isNetworkError(err)) {
          return true
        }

        // Skip retry on 4xx client errors (but retry on 429 Too Many Requests)
        const isClientError = status >= 400 && status !== 429 && status < 500
        if (isClientError) {
          return false
        }

        // Retry on server error
        const isServerError = status >= 500
        return isServerError
      },

      onRetry: (retryCount, error, requestConfig) => {
        const url = requestConfig.url || 'unknown'
        const method = requestConfig.method?.toUpperCase() || 'unknown'
        const status = error.response?.status || 'network error'
        logger.warn(
          `🔄 Retrying ${method} ${url} (attempt ${retryCount}/3) - ${status}`,
        )
      },

      ...retryConfig,
    })
  }
}

const http = new Http()

export { http }
