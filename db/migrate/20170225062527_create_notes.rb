class CreateNotes < ActiveRecord::Migration[5.0]
  def change
    create_table :notes do |t|
      t.text :text
      t.float :x
      t.float :y
      t.belongs_to :canvas

      t.timestamps
    end
  end
end
