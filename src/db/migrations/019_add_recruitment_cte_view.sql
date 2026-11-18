-- A CTE and window function produce one rank per evaluated player.
CREATE OR REPLACE VIEW vw_ranked_scout_targets AS
WITH report_scores AS (
  SELECT player_id, AVG(overall_rating) AS avg_rating, COUNT(*) AS report_count
  FROM scout_report
  GROUP BY player_id
)
SELECT p.player_id, CONCAT(p.first_name, ' ', p.last_name) AS player_name,
       p.primary_position, rs.avg_rating, rs.report_count,
       DENSE_RANK() OVER (ORDER BY rs.avg_rating DESC) AS recruitment_rank
FROM report_scores rs
INNER JOIN player p ON p.player_id = rs.player_id;
