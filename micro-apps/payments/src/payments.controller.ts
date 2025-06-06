import { Controller, Post, Body, HttpStatus, HttpException, Logger, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

interface PaymentRequest {
  amount: number;
  currency: string;
  card: {
    number: string;
    expiry: string;
  };
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async processPayment(
    @Req() req: RawBodyRequest<Request>,
    @Body() paymentRequest: PaymentRequest
  ) {
    const requestId = Date.now().toString();
    this.logger.log(`[${requestId}] Received payment request`);
    
    try {
      // Log raw body for debugging
      if (req.rawBody) {
        this.logger.debug(`[${requestId}] Raw body: ${req.rawBody.toString()}`);
      }

      // Validate request body
      if (!paymentRequest || !paymentRequest.amount || !paymentRequest.currency || !paymentRequest.card) {
        throw new Error('Invalid request body');
      }

      this.logger.log(`[${requestId}] Processing payment: ${JSON.stringify(paymentRequest)}`);
      this.logger.debug(`[${requestId}] Headers: ${JSON.stringify(req.headers)}`);
      
      const result = await this.paymentsService.processPayment(paymentRequest);
      this.logger.log(`[${requestId}] Payment processed successfully: ${JSON.stringify(result)}`);
      
      return {
        success: true,
        transactionId: result.transactionId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        status: 'completed',
        requestId
      };
    } catch (error) {
      this.logger.error(`[${requestId}] Payment processing failed: ${error.message}`, error.stack);
      throw new HttpException({
        success: false,
        error: error.message,
        requestId
      }, HttpStatus.BAD_REQUEST);
    }
  }
} 