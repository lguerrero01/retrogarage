import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Order, DailySummary, Invoice } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private invoicesSubject = new BehaviorSubject<Invoice[]>(this.getStoredInvoices());
  invoices$ = this.invoicesSubject.asObservable();

  private readonly TAX_RATE = 0.16; // 16% IVA
  private readonly RESTAURANT_INFO = {
    name: 'Retro Garage',
    address: 'Av. Principal #123, Ciudad, Estado',
    phone: '+52 (555) 123-4567',
    email: 'info@retrogarage.com'
  };

  private getStoredInvoices(): Invoice[] {
    try {
      const stored = localStorage.getItem('restaurant-invoices');
      const invoices = stored ? JSON.parse(stored) : [];
      return invoices.map((invoice: any) => ({
        ...invoice,
        timestamp: new Date(invoice.timestamp)
      }));
    } catch {
      return [];
    }
  }

  private updateInvoicesStorage(invoices: Invoice[]) {
    localStorage.setItem('restaurant-invoices', JSON.stringify(invoices));
    this.invoicesSubject.next(invoices);
  }

  generateInvoice(order: Order): Invoice {
    const subtotal = order.total / (1 + this.TAX_RATE);
    const tax = order.total - subtotal;

    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      orderId: order.id,
      customer: order.customer,
      items: order.items,
      subtotal: subtotal,
      tax: tax,
      total: order.total,
      timestamp: new Date(),
      restaurantInfo: this.RESTAURANT_INFO
    };

    const currentInvoices = this.invoicesSubject.value;
    this.updateInvoicesStorage([invoice, ...currentInvoices]);

    return invoice;
  }

  generateDailySummary(orders: Order[], date: Date = new Date()): DailySummary {
    const dateStr = date.toISOString().split('T')[0];
    const dayOrders = orders.filter(order => 
      order.timestamp.toISOString().split('T')[0] === dateStr
    );

    const ordersByStatus = {
      pending: dayOrders.filter(o => o.status === 'pending').length,
      preparing: dayOrders.filter(o => o.status === 'preparing').length,
      ready: dayOrders.filter(o => o.status === 'ready').length,
      completed: dayOrders.filter(o => o.status === 'completed').length,
      cancelled: dayOrders.filter(o => o.status === 'cancelled').length
    };

    const ordersByCategory: { [category: string]: number } = {};
    const itemStats: { [itemName: string]: { quantity: number; revenue: number } } = {};

    dayOrders.forEach(order => {
      order.items.forEach(item => {
        // Count by category
        ordersByCategory[item.category] = (ordersByCategory[item.category] || 0) + item.quantity;
        
        // Count items
        if (!itemStats[item.name]) {
          itemStats[item.name] = { quantity: 0, revenue: 0 };
        }
        itemStats[item.name].quantity += item.quantity;
        itemStats[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.entries(itemStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      date: dateStr,
      totalOrders: dayOrders.length,
      totalRevenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
      ordersByStatus,
      ordersByCategory,
      topItems
    };
  }

  printInvoice(invoice: Invoice) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHtml = this.generateInvoiceHtml(invoice);
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  }

  printDailySummary(summary: DailySummary, orders: Order[]) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const summaryHtml = this.generateDailySummaryHtml(summary, orders);
    printWindow.document.write(summaryHtml);
    printWindow.document.close();
    printWindow.print();
  }

  private generateInvoiceHtml(invoice: Invoice): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2a23b8; padding-bottom: 20px; margin-bottom: 20px; }
          .restaurant-name { color: #2a23b8; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; }
          .total-row { font-weight: bold; font-size: 18px; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">${invoice.restaurantInfo.name}</div>
          <div>${invoice.restaurantInfo.address}</div>
          <div>Tel: ${invoice.restaurantInfo.phone} | Email: ${invoice.restaurantInfo.email}</div>
        </div>

        <div class="invoice-info">
          <div>
            <strong>Factura #:</strong> ${invoice.id}<br>
            <strong>Pedido #:</strong> ${invoice.orderId.slice(-6)}<br>
            <strong>Fecha:</strong> ${invoice.timestamp.toLocaleDateString('es-ES')}
          </div>
          <div>
            <strong>Hora:</strong> ${invoice.timestamp.toLocaleTimeString('es-ES')}
          </div>
        </div>

        <div class="customer-info">
          <strong>Cliente:</strong><br>
          ${invoice.customer.name}<br>
          Tel: ${invoice.customer.phone}<br>
          ${invoice.customer.table ? `Mesa: ${invoice.customer.table}<br>` : ''}
          ${invoice.customer.notes ? `Notas: ${invoice.customer.notes}` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
          <div>IVA (16%): $${invoice.tax.toFixed(2)}</div>
          <div class="total-row">Total: $${invoice.total.toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>¡Gracias por su preferencia!</p>
          <p>Conserve este comprobante para cualquier aclaración</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateDailySummaryHtml(summary: DailySummary, orders: Order[]): string {
    const completedOrders = orders.filter(o => 
      o.status === 'completed' && 
      o.timestamp.toISOString().split('T')[0] === summary.date
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cierre de Venta - ${summary.date}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2a23b8; padding-bottom: 20px; margin-bottom: 20px; }
          .restaurant-name { color: #2a23b8; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .summary-card h3 { margin-top: 0; color: #2a23b8; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f2f2f2; }
          .total-revenue { font-size: 24px; font-weight: bold; color: #ed450d; text-align: center; margin: 20px 0; }
          .footer { margin-top: 30px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">Retro Garage</div>
          <h2>Cierre de Venta Diario</h2>
          <p>Fecha: ${new Date(summary.date).toLocaleDateString('es-ES')}</p>
        </div>

        <div class="total-revenue">
          Ingresos Totales: $${summary.totalRevenue.toFixed(2)}
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Resumen de Órdenes</h3>
            <p>Total de órdenes: <strong>${summary.totalOrders}</strong></p>
            <p>Pendientes: ${summary.ordersByStatus.pending}</p>
            <p>Preparando: ${summary.ordersByStatus.preparing}</p>
            <p>Listos: ${summary.ordersByStatus.ready}</p>
            <p>Completados: ${summary.ordersByStatus.completed}</p>
          </div>

          <div class="summary-card">
            <h3>Ventas por Categoría</h3>
            ${Object.entries(summary.ordersByCategory).map(([category, count]) => 
              `<p>${category}: ${count} items</p>`
            ).join('')}
          </div>
        </div>

        <div class="summary-card">
          <h3>Top 5 Productos Más Vendidos</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              ${summary.topItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary-card">
          <h3>Detalle de Órdenes Completadas</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Pedido #</th>
                <th>Cliente</th>
                <th>Hora</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${completedOrders.map(order => `
                <tr>
                  <td>${order.id.slice(-6)}</td>
                  <td>${order.customer.name}</td>
                  <td>${order.timestamp.toLocaleTimeString('es-ES')}</td>
                  <td>$${order.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Reporte generado el ${new Date().toLocaleString('es-ES')}</p>
          <p>Retro Garage - Sistema de Gestión de Órdenes</p>
        </div>
      </body>
      </html>
    `;
  }
}