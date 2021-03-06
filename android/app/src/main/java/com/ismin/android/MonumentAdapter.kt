package com.ismin.android

import android.app.Activity
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView

class MonumentAdapter(private val monuments: ArrayList<Monument>, private val fragment : MonumentListFragment): RecyclerView.Adapter<MonumentViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MonumentViewHolder {
        val row = LayoutInflater.from(parent.context).inflate(R.layout.row_monument, parent, false)
        return MonumentViewHolder(row)
    }

    override fun onBindViewHolder(holder: MonumentViewHolder, position: Int) {
        val imm = monuments[position].immeuble
        val dep = monuments[position].dep
        val com = monuments[position].nomcom
        val fav = monuments[position].favorite

        holder.txvImm.text = imm
        holder.txvDep.text = dep
        holder.txvCom.text = com
        holder.schFav.isChecked = fav
        holder.schFav.setOnCheckedChangeListener{_,_ ->
            (fragment.activity as MainActivity).favorite(monuments[position].datasetid)
        }
    }

    override fun getItemCount(): Int {
        return monuments.size
    }
}
