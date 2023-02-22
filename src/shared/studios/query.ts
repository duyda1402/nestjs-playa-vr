// SELECT t.term_id, t.name, (SELECT SUM(premium_popular_score) as `popularity`
// FROM popular_scores pp
// INNER JOIN wp_rkr3j35p5r_term_relationships_basic tr ON pp.post_id = tr.object_id
// WHERE tr.term_taxonomy_id = t.term_id) as `popularity`

// FROM wp_rkr3j35p5r_terms t
// INNER JOIN wp_rkr3j35p5r_term_taxonomy tt ON t.term_id = tt.term_id
// WHERE tt.taxonomy = 'studio'
// ORDER BY popularity DESC
