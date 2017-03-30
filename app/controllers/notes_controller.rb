class NotesController < ApplicationController
  def index
    render json: canvas.notes
  end

  def create
    new_note = canvas.notes.create!(note_params)

    render json: new_note
  end

  def update
    note.update!(note_params)

    render json: note
  end

  private

  def canvas
    @canvas ||= Canvas.find(params[:canvase_id])
  end

  def note
    @note ||= Note.find(params[:id])
  end

  def note_params
    params.require(:note).permit(:x, :y, :text)
  end
end
