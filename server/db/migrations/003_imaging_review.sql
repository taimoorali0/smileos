INSERT IGNORE INTO group_permission (group_id, permission)
SELECT id, 'ImageReview' FROM user_group WHERE name IN ('Admin', 'Dentist');
