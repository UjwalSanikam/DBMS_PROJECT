# Evaluation Rubric Traceability

The supplied DBMS Level 3 PDF contains 14 components totaling 50 marks. This matrix records implementation and executed evidence, not awarded marks.

| Component | Maximum | Evidence | Status |
| --- | ---: | --- | --- |
| ER diagram | 2 | ER_DIAGRAM.png, SVG, DOT and Mermaid source | Included |
| Relational schema, keys, relationships and constraints | 3 | RELATIONAL_SCHEMA.md; DATA_DICTIONARY.md; migrations; integrity tests | Documented and verified |
| SQL DDL with constraints | 4 | Migrations 001-019; fresh/repeat migration checks | Verified |
| NoSQL or vector database creation | 4 | Qdrant player_profiles; size 10, Cosine; VEC-01 to VEC-03 | Verified |
| Technology justification | 1 | PROJECT_REPORT.md; MySQL relational integrity and Qdrant nearest neighbors | Documented |
| DML operations | 4 | CRUD-01 through CRUD-09; shortlist create/read/update/delete | Verified |
| Nested, correlated or recursive queries and joins | 4 | Latest-value nested aggregation, NOT EXISTS availability and joined search | Implemented and executed |
| Advanced SQL | 6 | Two procedures, four triggers, CTE and DENSE_RANK view, indexes and event | Verified |
| Vector feature and RUD | 7 | Similarity query, upsert, Admin delete/refresh, VEC-01 through VEC-10 | Verified |
| Next.js interface | 3 | Login, dashboard, player pages, comparison and vector screenshots | Observed |
| Backend/API database integration | 2 | MySQL and Qdrant API tests and browser demo | Verified |
| Authentication and two roles with database RBAC | 4 | ADMIN/SCOUT sessions, separate MySQL accounts/roles; AUTH and RBAC tests | Verified |
| Documentation and Git/GitHub | 2 | Report, README, diagram, screenshots, executed results, public repository | Prepared |
| Originality, individual contribution, modification and viva | 4 | Team-requested 50/50 allocation and DEMO_GUIDE.md | Students complete live evaluation |
| Total | 50 | Technical evidence provided | Evaluator awards marks |

The report includes all nine requested submission topics. Team members must confirm title uniqueness within the section, explain actual authorship and assistance, rehearse their assigned work and complete the live viva. No test can establish originality or predict a grade.
