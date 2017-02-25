class Canvas < ApplicationRecord
  self.table_name = "canvases"

  has_many :notes
end
