import { Injectable, Logger } from '@nestjs/common';

interface PaymentRequest {
  amount: number;
  currency: string;
  card: {
    number: string;
    expiry: string;
  };
}

interface PaymentResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const startTime = Date.now();
    this.logger.log(`[${startTime}] Starting payment processing`);

    try {
      // Validate amount
      if (paymentRequest.amount <= 0) {
        this.logger.error(`[${startTime}] Invalid amount: ${paymentRequest.amount}`);
        throw new Error('Amount must be greater than 0');
      }

      // Validate currency
      if (!['EUR', 'USD'].includes(paymentRequest.currency)) {
        this.logger.error(`[${startTime}] Invalid currency: ${paymentRequest.currency}`);
        throw new Error('Currency must be EUR or USD');
      }

      // Validate card
      if (!this.isValidCard(paymentRequest.card)) {
        this.logger.error(`[${startTime}] Invalid card details`);
        throw new Error('Invalid card details');
      }

      // Simuler un délai de traitement (réduit à 100ms)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Générer un ID de transaction unique
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simuler une réponse réussie
      const response: PaymentResponse = {
        transactionId,
        status: 'completed',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        timestamp: new Date().toISOString(),
      };

      const endTime = Date.now();
      this.logger.log(`[${startTime}] Payment processed successfully in ${endTime - startTime}ms`);
      this.logger.debug(`[${startTime}] Response: ${JSON.stringify(response)}`);
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      this.logger.error(`[${startTime}] Payment processing failed after ${endTime - startTime}ms: ${error.message}`);
      throw error;
    }
  }

  private isValidCard(card: { number: string; expiry: string }): boolean {
    // Vérifier le format du numéro de carte
    if (!/^\d{16}$/.test(card.number)) {
      return false;
    }

    // Vérifier le format de la date d'expiration
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
      return false;
    }

    return true;
  }
} 