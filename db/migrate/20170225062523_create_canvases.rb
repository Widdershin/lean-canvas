class CreateCanvases < ActiveRecord::Migration[5.0]
  def change
    create_table :canvases do |t|
      t.belongs_to :user

      t.timestamps
    end
  end
end
