import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios/index';
import * as http from 'http';
import * as https from 'https';
import { LoadedRoute } from '../route-loader/interfaces/loaded-route.interface';

@Injectable()
export class HttpService {
  private readonly axiosInstance;

  constructor() {
    const httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      timeout: 60000,
    });

    const httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 100,
      timeout: 60000,
    });

    const config = {
      httpAgent,
      httpsAgent,
      timeout: 5000,
      maxRedirects: 5,
      maxContentLength: 50 * 1024 * 1024, // 50MB
      headers: {
        'Connection': 'keep-alive',
      },
    };

    this.axiosInstance = axios.create(config);
  }

  async request(route: LoadedRoute, data?: any) {
    const config: AxiosRequestConfig = {
      method: route.method,
      url: route.backend_url,
    };

    // Ajouter les données pour les méthodes POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      if (data !== undefined && data !== null) {
        config.data = data;
        // Si les données sont un objet ou un tableau, on les envoie en JSON
        if (typeof data === 'object' && !(data instanceof FormData)) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json',
          };
        }
      }
    }

    // Ajouter les paramètres de requête pour les méthodes GET, DELETE
    if (['GET', 'DELETE'].includes(route.method) && data) {
      config.params = data;
    }

    try {
      const response = await this.axiosInstance.request(config);
      let responseData = response.data;

      // Si la réponse est une chaîne de caractères, essayer de la parser
      if (typeof responseData === 'string') {
        try {
          // Essayer de trouver un objet JSON dans la chaîne
          const jsonMatch = responseData.match(/\{.*\}/);
          if (jsonMatch) {
            responseData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // Si le parsing échoue, garder la chaîne originale
          console.warn('Failed to parse response as JSON:', e);
        }
      }

      return responseData;
    } catch (error) {
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui est en dehors de la plage 2xx
        throw new Error(`HTTP Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        throw new Error('No response received from server');
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }
} 