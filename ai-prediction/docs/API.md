# API Documentation

## Price Feed Contract

### Administrative Functions

#### `set-authorized-source`
Allows contract admin to authorize or revoke data sources.

```clarity
(set-authorized-source (source principal) (status bool))
```
- Parameters:
  - `source`: Principal to authorize
  - `status`: Authorization status
- Returns: (ok true) on success
- Errors:
  - u100: Not authorized
  
### Price Submission

#### `submit-price-data`
Submit new price data from authorized source.

```clarity
(submit-price-data (price uint) (weight uint))
```
- Parameters:
  - `price`: Current price in micro-units
  - `weight`: Source weight (1-100)
- Returns: (ok true) on success
- Errors:
  - u101: Invalid price
  - u102: Unauthorized source

#### `aggregate-prices`
Aggregate prices from all valid sources.

```clarity
(aggregate-prices)
```
- Returns: (ok true) on success
- Errors:
  - u101: Invalid price
  - u103: Insufficient data

### Read-Only Functions

#### `get-valid-sources`
Returns list of currently valid price sources.

```clarity
(get-valid-sources)
```
- Returns: (list 10 principal)

## Market Predictor Contract

### Prediction Management

#### `submit-prediction`
Submit new market prediction.

```clarity
(submit-prediction (pred int) (conf uint))
```
- Parameters:
  - `pred`: Prediction value (-100 to 100)
  - `conf`: Confidence score (1-99)
- Returns: (ok true) on success
- Errors:
  - u100: Not authorized
  - u101: Invalid prediction
  - u102: Invalid range

#### `get-prediction`
Retrieve prediction by timestamp.

```clarity
(get-prediction (timestamp uint))
```
- Parameters:
  - `timestamp`: Block height
- Returns: Optional prediction data
