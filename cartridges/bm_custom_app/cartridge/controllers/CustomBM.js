'use strict';

const ISML = require('dw/template/ISML');

function customFunction() {
    ISML.renderTemplate('customBMPage');
}

function filterOrders() {
    const OrderMgr = require('dw/order/OrderMgr');
    const Site = require('dw/system/Site');
    const Calendar = require('dw/util/Calendar');
    const Order = require('dw/order/Order');

    var days = parseInt(request.httpParameterMap.period.value || '30', 10);
    if (isNaN(days) || days <= 0) days = 30;

    // data de corte
    var cal = new Calendar();
    cal.add(Calendar.DAY_OF_MONTH, -days);

    // busca pedidos a partir da data de corte
    // (ajuste o sort/order/status conforme sua necessidade)
    var ordersIter = OrderMgr.searchOrders(
            'status!={0} AND status!={1} AND status!={2} AND creationDate >= {3}',
            'creationDate desc',
            Order.ORDER_STATUS_REPLACED,
            Order.ORDER_STATUS_FAILED,
            Order.ORDER_STATUS_CANCELLED,
            cal.getTime()
        );

    var stats = {
        CREDIT_CARD: { count: 0, revenue: 0 },
        HubPIX: { count: 0, revenue: 0 }
    };

    var currencyCode = Site.current.getDefaultCurrency() || 'USD';

    try {
        while (ordersIter.hasNext()) {
            var order = ordersIter.next();

            var pmID = order.custom.AR_paymentMethod;

            if (!(pmID in stats)) {
                continue;
            }

            // receita bruta do pedido
            var gross = order.getTotalGrossPrice();
            var amount = gross ? gross.getValue() : 0;

            stats[pmID].count += 1;
            stats[pmID].revenue += amount;
        }
    } finally {
        if (ordersIter) ordersIter.close();
    }

    ISML.renderTemplate('orderStats', {
        days: days,
        currencyCode: currencyCode,
        stats: stats,
        period: days
    });

};

exports.CustomFunction = customFunction;
exports.CustomFunction.public = true;
exports.FilterOrders = filterOrders;
exports.FilterOrders.public = true;
