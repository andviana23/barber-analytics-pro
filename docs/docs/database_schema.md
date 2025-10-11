# 🧩 Barber Analytics Pro — Database Schema

> Estrutura de banco de dados relacional (PostgreSQL) utilizada no Supabase  
> Todas as tabelas seguem convenção `snake_case` e possuem `UUID` como chave primária.

---

## 🏢 Table: `units`

| Column     | Type      | Description                               |
| ---------- | --------- | ----------------------------------------- |
| id         | UUID      | Primary key                               |
| name       | TEXT      | Barbershop name (Mangabeiras / Nova Lima) |
| status     | BOOLEAN   | Active status                             |
| created_at | TIMESTAMP | Creation date                             |
| updated_at | TIMESTAMP | Last modification                         |

---

## 💈 Table: `professionals`

| Column          | Type         | Description              |
| --------------- | ------------ | ------------------------ |
| id              | UUID         | Primary key              |
| name            | TEXT         | Barber name              |
| commission_rate | NUMERIC(5,2) | Percentage of commission |
| is_active       | BOOLEAN      | Employment status        |
| unit_id         | UUID (FK)    | References `units(id)`   |
| created_at      | TIMESTAMP    | Record creation          |
| updated_at      | TIMESTAMP    | Last update              |

---

## 💰 Table: `revenues`

| Column          | Type                        | Description                |
| --------------- | --------------------------- | -------------------------- |
| id              | UUID                        | Primary key                |
| unit_id         | UUID (FK)                   | References `units`         |
| professional_id | UUID (FK)                   | References `professionals` |
| type            | ENUM(service, subscription) | Type of income             |
| source          | TEXT                        | Description of source      |
| value           | NUMERIC(12,2)               | Income amount              |
| date            | DATE                        | Date of entry              |
| created_at      | TIMESTAMP                   | Record creation            |

---

## 🧾 Table: `expenses`

| Column      | Type                  | Description                             |
| ----------- | --------------------- | --------------------------------------- |
| id          | UUID                  | Primary key                             |
| unit_id     | UUID (FK)             | References `units`                      |
| type        | ENUM(fixed, variable) | Expense type                            |
| category    | TEXT                  | Category (e.g., Rent, Energy, Internet) |
| description | TEXT                  | Additional details                      |
| value       | NUMERIC(12,2)         | Expense amount                          |
| date        | DATE                  | Expense date                            |
| created_at  | TIMESTAMP             | Record creation                         |

---

## ✂️ Table: `bookings`

| Column          | Type          | Description                             |
| --------------- | ------------- | --------------------------------------- |
| id              | UUID          | Primary key                             |
| unit_id         | UUID (FK)     | References `units`                      |
| professional_id | UUID (FK)     | References `professionals`              |
| service_type    | TEXT          | Type of service (haircut, beard, combo) |
| service_value   | NUMERIC(10,2) | Service price                           |
| date            | TIMESTAMP     | Date/time of service                    |
| created_at      | TIMESTAMP     | Creation date                           |

---

## 📅 Table: `subscriptions`

| Column        | Type          | Description               |
| ------------- | ------------- | ------------------------- |
| id            | UUID          | Primary key               |
| unit_id       | UUID (FK)     | References `units`        |
| client_name   | TEXT          | Name of subscribed client |
| monthly_value | NUMERIC(10,2) | Subscription price        |
| status        | BOOLEAN       | Active/inactive           |
| created_at    | TIMESTAMP     | Record creation           |

---

## 🪒 Table: `service_queue`

| Column          | Type                            | Description                |
| --------------- | ------------------------------- | -------------------------- |
| id              | UUID                            | Primary key                |
| unit_id         | UUID (FK)                       | References `units`         |
| professional_id | UUID (FK)                       | References `professionals` |
| position        | INTEGER                         | Position in the queue      |
| status          | ENUM(active, paused, attending) | Queue status               |
| updated_at      | TIMESTAMP                       | Last update time           |

---

## 📈 Table: `monthly_summary`

| Column         | Type          | Description                          |
| -------------- | ------------- | ------------------------------------ |
| id             | UUID          | Primary key                          |
| unit_id        | UUID (FK)     | References `units`                   |
| month          | INTEGER       | Month number (1-12)                  |
| year           | INTEGER       | Year of reference                    |
| total_revenue  | NUMERIC(12,2) | Total income                         |
| total_expenses | NUMERIC(12,2) | Total costs                          |
| profit         | NUMERIC(12,2) | Auto-calculated (revenue - expenses) |
| average_ticket | NUMERIC(10,2) | Average ticket per client            |
| created_at     | TIMESTAMP     | Record creation                      |

---

## 🧮 View: `v_dre_summary`

| Column         | Type          | Description           |
| -------------- | ------------- | --------------------- |
| unit_id        | UUID          | Unit ID               |
| unit_name      | TEXT          | Unit name             |
| month          | DATE          | Month (truncated)     |
| total_revenue  | NUMERIC(12,2) | Total income in month |
| total_expenses | NUMERIC(12,2) | Total expenses        |
| profit         | NUMERIC(12,2) | Net profit            |

---

## 🔐 Triggers and Functions

| Name                           | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `update_timestamp()`           | Automatically updates `updated_at`     |
| `trigger_update_professionals` | Keeps professionals timestamps updated |
| `trigger_update_units`         | Keeps units timestamps updated         |

---

## 🧭 Notes

- All IDs use `gen_random_uuid()` for consistency.
- ENUMs ensure data integrity and simplify UI filters.
- Designed for integration with Supabase Realtime and Edge Functions.
- Follows **Clean Architecture** and **3NF normalization**.

---

📘 **File generated by:** Jarvis DevIA  
📅 **For Project:** Barber Analytics Pro  
🧠 **Stack:** Supabase + React + TypeScript + Tailwind
