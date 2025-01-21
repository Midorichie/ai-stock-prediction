;; market-predictor.clar
;; Main contract for market prediction logic

(define-data-var last-prediction uint u0)
(define-data-var confidence-score uint u0)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-prediction (err u101))
(define-constant err-invalid-range (err u102))

;; Data structures
(define-map predictions
    uint ;; timestamp
    {
        prediction: int,
        confidence: uint,
        actual-value: (optional int)
    }
)

;; Private functions
(define-private (validate-prediction (pred int))
    (and (>= pred -100) (<= pred 100))
)

;; Public functions
(define-public (submit-prediction (pred int) (conf uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (and (> conf u0) (< conf u100)) err-invalid-prediction)
        (asserts! (validate-prediction pred) err-invalid-range)
        (ok (map-set predictions
            (var-get last-prediction)
            {
                prediction: pred,
                confidence: conf,
                actual-value: none
            }
        ))
    )
)

;; Read-only functions
(define-read-only (get-prediction (timestamp uint))
    (map-get? predictions timestamp)
)
