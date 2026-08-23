# ai_service/

The AI/ML service layer — logically separate from `backend/`'s normal
CRUD/business logic, per the proposal's service-oriented architecture.
Will hold `prediction_service.py`, `clustering_service.py`,
`recommendation_service.py`, `alert_service.py`, and `saved_models/`
(the trained `.joblib` artifacts).

Populated from Phase 12 (Performance Prediction Models) onward, after the ML
notebook in `ml/` has trained and saved the models this service loads.

Empty in Phase 1.
