CREATE POLICY "holder_read_own_transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rights_holders
      WHERE rights_holders.project_id = transactions.project_id
      AND rights_holders.user_id = auth.uid()
    )
  );
