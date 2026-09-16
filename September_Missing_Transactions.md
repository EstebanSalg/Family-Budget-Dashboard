# September transactions missing from the Expense Log

Compared 48 ESG rows + 29 NRA rows against 13 logged rows.

## Missing -- recommend logging these (50)

| Date | Account | Amount | Description |
|---|---|---|---|
| 2026-09-01 | ESG | -$42.90 | WALMART STORE #   _M |
| 2026-09-01 | ESG | -$8.40 | WALMART STORE #   _M |
| 2026-09-01 | NRA | +$24.86 | pos return Fpos Walmart Store #3638 Barrh |
| 2026-09-01 | NRA | +$1286.00 | ei Canada |
| 2026-09-03 | ESG | -$140.03 | TEMU.COM          _V |
| 2026-09-03 | ESG | -$261.56 | FIDO         U2K8W8 |
| 2026-09-03 | ESG | -$323.98 | LendCare         MSP |
| 2026-09-03 | ESG | +$120.00 | E-TRANSFER ***4vq |
| 2026-09-03 | NRA | -$2.05 | debit memo Bank The Rest |
| 2026-09-03 | NRA | -$57.95 | pos purchase Opos Amzn Mktp Ca        866-2 |
| 2026-09-04 | ESG | -$11.24 | KIXCARE INC.      _V |
| 2026-09-04 | NRA | -$10.00 | customer transfer dr. Investment Purchase |
| 2026-09-08 | ESG | -$3.21 | GOOGLE *SERVICE   _V |
| 2026-09-08 | ESG | -$233.20 | COSTCO WHOLESAL |
| 2026-09-08 | ESG | -$50.00 | COSTCO GAS W126   _F |
| 2026-09-08 | ESG | -$25.49 | FOOD BASICS 100   _M |
| 2026-09-08 | ESG | -$26.92 | Lyft *Temp Auth   _V |
| 2026-09-08 | ESG | -$239.54 | MEXI'S KENT BLV   _M |
| 2026-09-08 | ESG | -$8.00 | FULLER MARINE S   _F |
| 2026-09-08 | ESG | -$8.98 | 1000 ISLANDS      _M |
| 2026-09-08 | ESG | -$41.59 | REXALL PHARMACY   _M |
| 2026-09-08 | ESG | -$50.00 | PETRO-CANADA 00   _F |
| 2026-09-08 | ESG | -$13.55 | PETRO-CANADA 00   _F |
| 2026-09-08 | ESG | -$50.90 | McDonalds 19785   _V |
| 2026-09-08 | ESG | -$31.98 | Lyft *Temp Auth   _V |
| 2026-09-08 | ESG | -$105.14 | WorldRemit        _V |
| 2026-09-08 | ESG | -$28.31 | HEALTHY PLANET    _M |
| 2026-09-08 | ESG | -$107.20 | WALMART STORE #   _M |
| 2026-09-08 | NRA | -$6.60 | debit memo Bank The Rest |
| 2026-09-08 | NRA | -$16.95 | pos purchase Apos Dollarama #0977     Kanat |
| 2026-09-09 | NRA | -$1.57 | debit memo Bank The Rest |
| 2026-09-09 | NRA | -$33.95 | service charge Monthly Fees |
| 2026-09-09 | NRA | -$23.43 | pos purchase Apos Food Basics 100     Nepea |
| 2026-09-10 | NRA | -$5.46 | debit memo Bank The Rest |
| 2026-09-10 | NRA | -$86.99 | pos purchase Opos Worldremit          Toron |
| 2026-09-10 | NRA | -$35.34 | pos purchase Opos Subway 7618         Nepea |
| 2026-09-10 | NRA | -$19.20 | pos purchase Opos Disney Plus         Burba |
| 2026-09-11 | ESG | -$203.40 | AYA BEAUTY STUD   _M |
| 2026-09-11 | ESG | -$51.92 | MOVATI ATHLETIC  FEE |
| 2026-09-11 | NRA | -$1.59 | debit memo Bank The Rest |
| 2026-09-11 | NRA | -$38.66 | pos purchase Apos Dollarama #1179     Nepea |
| 2026-09-11 | NRA | -$84.75 | pos purchase Apos Aya Beauty Stud     Ottaw |
| 2026-09-11 | NRA | -$10.00 | customer transfer dr. Investment Purchase |
| 2026-09-12 | NRA | -$1.65 | debit memo Bank The Rest |
| 2026-09-12 | NRA | -$58.35 | pos purchase Apos Walmart Store #     Barrh |
| 2026-09-14 | ESG | -$50.00 | MARK'S STORE #7   _F |
| 2026-09-14 | ESG | -$9.96 | WALMART STORE #   _M |
| 2026-09-14 | ESG | -$92.26 | FOOD BASICS 100   _M |
| 2026-09-14 | NRA | -$30.00 | customer transfer dr. Mb-Transfer |
| 2026-09-15 | NRA | +$1286.00 | ei Canada |

## Possible matches -- amount differs from what's logged, please verify (4)

| Date | Account | Bank Amount | Bank Description | Logged Amount | Logged Description | Diff |
|---|---|---|---|---|---|---|
| 2026-09-01 | ESG | -$2650.00 | SEND E-TFR ***bX8 | $2600.00 | Monthly rent payment | $50.00 |
| 2026-09-01 | ESG | +$50.00 | E-TRANSFER ***djA | $51.00 | Walmart shopping groceries | $1.00 |
| 2026-09-02 | NRA | -$86.99 | pos purchase Opos Worldremit          Toron | $85.00 | WorldRemit doctor appointments | $1.99 |
| 2026-09-14 | ESG | -$3.03 | WALMART STORE #   _M | $3.00 | E-transfer refund | $0.03 |

## Excluded as internal/household transfers, not logged on purpose (15)

| Date | Account | Amount | Description | Reason |
|---|---|---|---|---|
| 2026-09-01 | ESG | -$1.50 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-01 | ESG | +$1450.00 | E-TRANSFER ***jYY | Household transfer between ESG/NRA accounts (matches NRA debit same day) |
| 2026-09-01 | NRA | -$1450.00 | withdrawal Free Interac E-Transfer | Household transfer between ESG/NRA accounts (matches ESG credit same day) |
| 2026-09-02 | ESG | -$1.00 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-04 | ESG | -$0.50 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-08 | ESG | -$1.00 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-09 | ESG | -$8.00 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-14 | ESG | -$0.50 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-14 | ESG | -$3.00 | SEND E-TFR ***mvE | Sent e-transfer cancelled same batch (ref ***mvE) -- nets to $0 |
| 2026-09-14 | ESG | -$1.00 | SEND E-TFR ***D7w | Sent e-transfer cancelled same batch (ref ***D7w) -- nets to $0 |
| 2026-09-14 | ESG | +$1.00 | CANCEL E-TFR ***D7w | Cancellation of sent e-transfer (ref ***D7w) -- nets to $0 |
| 2026-09-14 | ESG | -$30.00 | SEND E-TFR ***gyu | Household transfer between ESG/NRA accounts (matches NRA credit same day) |
| 2026-09-14 | NRA | +$30.00 | deposit Free Interac E-Transfer | Household transfer between ESG/NRA accounts (matches ESG debit same day) |
| 2026-09-15 | ESG | -$2.00 | SSV TO:  32726106353 | Internal transfer to savings (SSV) |
| 2026-09-15 | ESG | +$3.00 | CANCEL E-TFR ***mvE | Cancellation of sent e-transfer (ref ***mvE) -- nets to $0 |

## Already matched exactly (8)

| Date | Account | Amount | Bank Description | Logged Category | Logged Description |
|---|---|---|---|---|---|
| 2026-09-01 | ESG | $163.56 | FAIRSTONE FINAN LOAN | 📦 Other | fstn |
| 2026-09-01 | NRA | $74.00 | withdrawal Free Interac E-Transfer | ✈️ Travel | Maya trip |
| 2026-09-04 | ESG | $37.05 | FOOD BASICS 100   _M | 📦 Other | Other expense Diego |
| 2026-09-08 | NRA | $45.48 | bill payment Mb-Flexiti Financial 86219414 | 🛒 Groceries | Flexity payment sofa furniture |
| 2026-09-08 | NRA | $56.45 | pos purchase Aips Skipthedishes       Winni | 🍽️ Dining Out | Subway takeout meal |
| 2026-09-14 | NRA | $100.00 | customer transfer dr. Mb-Credit Card/Loc Pay. | 💳 Credit Cards | Credit card payment |
| 2026-09-15 | ESG | $2467.41 | ESRI CANADA LIM  PAY | 💰 Income | Esri Canada payroll |
| 2026-09-15 | ESG | $38.03 | FRESHCO #9689     _M | 🛒 Groceries | Freshco |
