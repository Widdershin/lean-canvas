class CanvasesController < ApplicationController
  def new
  end

  def create
    canvas = Canvas.create!

    redirect_to action: :show, id: canvas.id
  end

  def show
  end
end
