;; price-feed.clar
;; Aggregates and validates price data from multiple sources

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-price (err u101))
(define-constant err-invalid-source (err u102))
(define-constant err-stale-data (err u103))
(define-constant max-price-age u3600) ;; 1 hour in seconds
(define-constant min-sources u3) ;; Minimum required sources

;; Constants for price validation
(define-constant min-price u0)            ;; Minimum allowed price
(define-constant max-price u1000000000)   ;; Maximum allowed price (adjust based on your needs)

;; Track authorized data sources
(define-map authorized-sources principal bool)

;; Store price data from each source
(define-map price-feeds
    principal  ;; source address
    {
        price: uint,
        timestamp: uint,
        weight: uint
    }
)

;; Store aggregated prices
(define-map aggregated-prices
    uint  ;; timestamp
    {
        price: uint,
        confidence: uint,
        count: uint
    }
)

;; Track active sources count
(define-data-var active-sources-count uint u0)

;; Initialize contract owner
(define-data-var contract-admin principal tx-sender)

;; Administrative functions
(define-public (set-authorized-source (source principal) (status bool))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-admin)) err-owner-only)
        (let
            ((current-status (default-to false (map-get? authorized-sources source))))
            ;; Update counter based on status change
            (if status
                (if (not current-status)
                    (var-set active-sources-count (+ (var-get active-sources-count) u1))
                    (var-set active-sources-count (var-get active-sources-count)) ;; no change
                )
                (if current-status
                    (var-set active-sources-count (- (var-get active-sources-count) u1))
                    (var-set active-sources-count (var-get active-sources-count)) ;; no change
                )
            )
            (ok (map-set authorized-sources source status))
        )
    )
)

;; Price validation helper
(define-private (is-valid-price (price uint))
    (and
        (>= price min-price)
        (<= price max-price)
    )
)

;; Price submission
(define-public (submit-price-data (price uint) (weight uint))
    (let
        (
            (current-time block-height)
        )
        (asserts! (is-authorized tx-sender) err-invalid-source)
        (asserts! (and (> weight u0) (<= weight u100)) err-invalid-price)
        (asserts! (is-valid-price price) err-invalid-price)
        (ok (map-set price-feeds
            tx-sender
            {
                price: price,
                timestamp: current-time,
                weight: weight
            }
        ))
    )
)

;; Aggregation function
(define-public (aggregate-prices)
    (begin
        (asserts! (>= (var-get active-sources-count) min-sources) err-invalid-price)
        (let
            (
                (current-time block-height)
                (total-weight u0)
                (weighted-sum u0)
            )
            (ok (map-set aggregated-prices
                current-time
                {
                    price: weighted-sum,
                    confidence: u95,  ;; placeholder confidence calculation
                    count: (var-get active-sources-count)
                }
            ))
        )
    )
)

;; Helper functions
(define-private (is-authorized (source principal))
    (default-to false (map-get? authorized-sources source))
)

(define-private (is-price-fresh (timestamp uint))
    (let
        (
            (current-time block-height)
        )
        (<= (- current-time timestamp) max-price-age)
    )
)

;; Read-only functions
(define-read-only (get-latest-price)
    (map-get? aggregated-prices block-height)
)

(define-read-only (get-source-status (source principal))
    (default-to false (map-get? authorized-sources source))
)

(define-read-only (get-active-sources-count)
    (var-get active-sources-count)
)
