class CanvasesController < ApplicationController
  def new
  end

  def create
    canvas = Canvas.create!

    redirect_to canvases_url(canvas)
  end

  def show
  end
end
