export const officialLinks = {
  c3DemandForecasting: 'https://c3.ai/products/c3-ai-demand-forecasting/',
  c3Docs: 'https://docs.c3.ai/docs/demandForecasting/5.0/topic/df-dg-overview',
}

export const keywordPages = [
  page({
    keyword: 'AI demand forecasting case study',
    path: '/resources/ai-demand-forecasting-case-study',
    title: 'AI Demand Forecasting Case Study for Shopify Inventory',
    h1: 'AI demand forecasting case study: from stockout panic to planned purchase orders',
    description:
      'A practical AI demand forecasting case study showing how a Shopify seller can turn sales history, promotions, and lead times into reorder quantities and order dates.',
    intent: 'Shopify operators who want a concrete example before installing a forecasting app.',
    sections: [
      section(
        'The starting problem',
        [
          'A Shopify accessories store sells about 540 units of a tote SKU every 30 days, has 420 units on hand, expects 120 inbound units, and needs 14 days for supplier lead time. A promotion is planned next week, so a simple moving average would understate demand.',
          'The practical question is not "what is next quarter revenue?" The buyer needs to know whether to place a purchase order now, how many units to buy, and which SKU deserves attention before cash is trapped in slow inventory.',
        ],
        [
          'Input sales from the last 180 days so seasonality and promotion spikes can be separated.',
          'Calculate 30, 60, and 90 day demand at SKU level instead of category level.',
          'Convert the forecast into a reorder point, safety stock, and purchase date.',
        ],
      ),
      section('The operating result', [
        'A good AI demand forecasting workflow gives the buyer a decision-ready replenishment list. It should flag the stockout window, recommend a reorder quantity, and later compare actual sales against the prediction so the model gets more trustworthy over time.',
        'The win is behavioral: the team stops opening spreadsheets only after a SKU is already red. They review exceptions weekly and place purchase orders before the risk becomes expensive.',
      ]),
    ],
  }),
  page({
    keyword: 'Demand forecasting AI tools',
    path: '/resources/demand-forecasting-ai-tools',
    title: 'Demand Forecasting AI Tools: What Retail Sellers Actually Need',
    h1: 'Demand forecasting AI tools: how to choose without buying shelfware',
    description:
      'A buyer-oriented guide to demand forecasting AI tools for Shopify and retail teams, including data requirements, workflow fit, alerts, and forecast accuracy tracking.',
    intent: 'Founders, operators, and inventory planners comparing demand forecasting software.',
    sections: [
      section(
        'Capabilities worth paying for',
        [
          'Demand forecasting AI tools are useful only when they shorten the path from data to an inventory decision. A beautiful forecast line is not enough if the buyer still has to calculate reorder quantities in another spreadsheet.',
          'For a Shopify seller, the first integration should pull orders, refunds, SKU variants, stock on hand, and product tags. Then it should layer lead time, safety stock, seasonality, and planned promotions before recommending the next purchase order.',
        ],
        [
          'SKU-level 30, 60, and 90 day forecasts.',
          'Reorder quantity and suggested order date.',
          'Stockout and overstock alerts by email or Slack.',
          'Actual versus forecast tracking after each period closes.',
          'Clear exception queue for SKUs that need human review.',
        ],
      ),
      section('How to evaluate vendors', [
        'Ask each vendor to forecast a handful of real SKUs using your history. Review whether the tool handles stockout days, promotions, launch SKUs, supplier delays, and bundles. If it cannot explain the recommendation, planners will not trust it.',
      ]),
    ],
  }),
  page({
    keyword: 'Ai demand forecasting examples',
    path: '/resources/ai-demand-forecasting-examples',
    title: 'AI Demand Forecasting Examples for Real Retail Decisions',
    h1: 'AI demand forecasting examples that change the next purchase order',
    description:
      'Concrete AI demand forecasting examples for stockouts, overstock, seasonal campaigns, product launches, and slow-moving retail SKUs.',
    intent: 'Retail teams looking for examples that map to inventory work instead of abstract data science demos.',
    sections: [
      section(
        'Examples by decision',
        [
          'The best examples start with a business decision. A forecast should tell the team what to buy, what to pause, what to promote, and what to monitor.',
          'A seasonal apparel SKU may need a higher safety stock during a campaign, while a slow accessory may need a reorder pause even when revenue looks healthy. Launch products may rely on similar SKU history until enough direct sales data exists.',
        ],
        [
          'Stockout prevention: reorder early when lead-time demand exceeds available inventory.',
          'Overstock reduction: slow purchase orders when days of cover rises above the target window.',
          'Promotion planning: lift baseline demand before the sale starts and track the forecast error afterward.',
          'New SKU forecasting: borrow demand shape from similar products until direct history is available.',
        ],
      ),
      section('What makes an example trustworthy', [
        'Trustworthy examples include the assumptions. Lead time, stock on hand, inbound units, promotion lift, and forecast accuracy matter as much as the model type. Without them, the example cannot become a real purchase order.',
      ]),
    ],
  }),
  page({
    keyword: 'AI demand forecasting in retail',
    path: '/resources/ai-demand-forecasting-in-retail',
    title: 'AI Demand Forecasting in Retail: From Prediction to Replenishment',
    h1: 'AI demand forecasting in retail starts with replenishment discipline',
    description:
      'How AI demand forecasting in retail improves replenishment, promotion planning, stockout alerts, overstock control, and forecast accuracy reviews.',
    intent: 'Retail operators who need a practical operating model for forecasting and inventory planning.',
    sections: [
      section(
        'Where AI helps retail teams',
        [
          'Retail demand is noisy because sales react to promotions, seasonality, influencer spikes, ads, price changes, and stock availability. AI helps by separating baseline demand from temporary lift and turning patterns into SKU-level forecasts.',
          'The workflow should stay close to replenishment. The forecast is only valuable when it becomes a recommended order date, reorder quantity, risk alert, or promotion adjustment.',
        ],
        [
          'Predict demand at SKU, variant, and location level where data supports it.',
          'Detect stockout days so false low demand does not mislead the model.',
          'Adjust for seasonal and promotional lift.',
          'Compare actual sales against forecast to improve trust.',
        ],
      ),
      section('The weekly planning rhythm', [
        'A practical retail rhythm is simple: review red stockout risks, review overstock risks, confirm purchase order constraints, update promotion assumptions, then export the replenishment list. The model should make the exception queue smaller each week.',
      ]),
    ],
  }),
  page({
    keyword: 'Ai demand forecasting companies',
    path: '/resources/ai-demand-forecasting-companies',
    title: 'AI Demand Forecasting Companies: Comparison Criteria',
    h1: 'AI demand forecasting companies: what to compare before booking demos',
    description:
      'A practical comparison guide for AI demand forecasting companies, from enterprise platforms to Shopify-first replenishment tools.',
    intent: 'Teams deciding whether they need an enterprise planning suite or a focused app for inventory decisions.',
    sections: [
      section(
        'The main categories',
        [
          'AI demand forecasting companies range from enterprise supply-chain suites to focused ecommerce apps. The right choice depends on planning complexity, integrations, SKU count, team size, and the cost of a wrong recommendation.',
          'Enterprise suites can unify ERP, finance, manufacturing, and external signals. A Shopify-first seller usually needs faster installation, cleaner SKU forecasts, replenishment recommendations, and low-friction payment.',
        ],
        [
          'Enterprise planning suites for large supply chains and multi-system data.',
          'Retail inventory platforms for replenishment and purchasing teams.',
          'Shopify apps for one-click install and seller-friendly forecasts.',
          'Open-source or spreadsheet workflows for early experimentation.',
        ],
      ),
      section('Questions that reveal fit', [
        'Ask how the company handles promotion calendars, new SKUs, stockout periods, returns, bundles, supplier lead times, and forecast accuracy. Then ask how long it takes to reach the first usable replenishment list.',
      ]),
    ],
  }),
  page({
    keyword: 'AI forecasting models',
    path: '/resources/ai-forecasting-models',
    title: 'AI Forecasting Models for Demand Planning',
    h1: 'AI forecasting models: which ones fit retail demand?',
    description:
      'A plain-English guide to AI forecasting models for retail demand, including baseline models, seasonal methods, gradient boosting, Prophet-style models, and ensemble approaches.',
    intent: 'Operators and technical teams choosing a forecasting approach without overcomplicating the MVP.',
    sections: [
      section(
        'Model choices that work in practice',
        [
          'The best AI forecasting model is the one that improves inventory decisions on your data. Many stores should start with a strong baseline, seasonality features, promotion adjustments, and an accuracy loop before reaching for a complex deep learning stack.',
          'For an MVP, Prophet-style models, statsforecast methods, gradient boosting with calendar features, and simple ensembles can be strong enough if the replenishment workflow is well designed.',
        ],
        [
          'Naive and moving-average baselines to detect whether AI is adding value.',
          'Seasonal exponential smoothing for recurring weekly or annual demand.',
          'Prophet-style models for trend, seasonality, and holiday effects.',
          'Gradient boosting when product, price, promotion, and channel features matter.',
          'Ensembles when different SKU groups behave differently.',
        ],
      ),
      section('The model is not the whole product', [
        'Forecasting models fail in production when planners do not trust the workflow. Explanations, exception queues, lead-time logic, and accuracy tracking are what turn a model into a buying decision.',
      ]),
    ],
  }),
  page({
    keyword: 'AI forecasting tools free',
    path: '/resources/ai-forecasting-tools-free',
    title: 'AI Forecasting Tools Free Options and Limits',
    h1: 'AI forecasting tools free: when free is enough and when it costs more',
    description:
      'A useful guide to free AI forecasting tools, spreadsheet workflows, open-source libraries, and the limits that appear when inventory decisions become time-sensitive.',
    intent: 'Small teams testing forecasting before committing to paid replenishment software.',
    sections: [
      section(
        'Free paths to try first',
        [
          'Free AI forecasting tools can help prove the shape of the problem. A spreadsheet, Python notebook, or open-source library can show whether sales history contains useful seasonality and whether a simple baseline is already good enough.',
          'The limit appears when the workflow needs to run every week, pull Shopify data automatically, alert the buyer, and track actual versus forecast without manual cleanup.',
        ],
        [
          'Spreadsheet moving averages for simple, stable SKUs.',
          'Python notebooks with open-source forecasting libraries.',
          'CSV exports from Shopify for one-off analysis.',
          'Manual forecast accuracy tracking for a few important SKUs.',
        ],
      ),
      section('When to move beyond free', [
        'Move beyond free when the cost of a missed purchase order is higher than the monthly subscription, or when the team spends more time preparing data than making decisions.',
      ]),
    ],
  }),
  page({
    keyword: 'C3 AI Demand Forecasting',
    path: '/resources/c3-ai-demand-forecasting',
    title: 'C3 AI Demand Forecasting: Fit, Alternatives, and Shopify Context',
    h1: 'C3 AI Demand Forecasting and the Shopify seller question',
    description:
      'A neutral guide to C3 AI Demand Forecasting, when enterprise demand planning platforms fit, and when a Shopify-first forecasting app may be the faster first step.',
    intent: 'Readers comparing enterprise AI demand planning with a focused Shopify forecasting workflow.',
    links: [officialLinks.c3DemandForecasting, officialLinks.c3Docs],
    sections: [
      section(
        'What C3 AI Demand Forecasting is built for',
        [
          'C3 AI presents Demand Forecasting as an enterprise application for granular forecasts across time horizons and planning cadences. Its public materials position it around demand planners, modelers, and larger supply-chain workflows.',
          'That can make sense for organizations with complex enterprise data, multiple planning systems, and executive supply-chain transformation budgets. The buying process is usually different from a Shopify app install.',
        ],
        [
          'Enterprise planning teams with many data sources.',
          'Forecasting programs that need platform-level integration.',
          'Use cases where demand forecasting connects to broader supply-chain optimization.',
        ],
      ),
      section('When a focused Shopify app is the better first step', [
        'A Shopify seller often needs an immediate replenishment answer: which SKUs will stock out, how many units should be reordered, and when should the PO be sent. A focused app can start with Shopify order history and inventory data, then expand once the operating rhythm is proven.',
        'A fair comparison should include time to first forecast, implementation cost, SKU workflow fit, alerting, accuracy tracking, and whether the team needs an enterprise platform or a narrower purchase-order assistant.',
      ]),
    ],
  }),
]

function page({ keyword, path, title, h1, description, intent, sections, links = [] }) {
  return {
    keyword,
    path,
    title,
    h1,
    description,
    eyebrow: keyword,
    lede: description,
    intent,
    sections,
    links,
    faqs: [
      {
        question: `Who is this ${keyword} guide for?`,
        answer:
          'It is written for ecommerce and retail operators who need inventory decisions, not abstract forecasting theory.',
      },
      {
        question: 'What should I do after reading it?',
        answer:
          'Run a forecast on a real SKU, check the reorder date and quantity, then compare the result with your current purchasing plan.',
      },
    ],
  }
}

function section(heading, paragraphs, bullets = []) {
  return { heading, paragraphs, bullets }
}
