"""



def save(self, *args, **kwargs):  # noqa
    file_watchers_before_save(self)
    is_new = self.pk is None
    if is_new:
        file_watchers_before_create(self)
    else:
        file_watchers_before_update(self)
    super().save(*args, **kwargs)
    file_watchers_after_save(self)
    file_watchers_after_commit(self)
    if is_new:
        file_watchers_after_create(self)
        transaction.on_commit(lambda: file_watchers_after_commit_create(self))
    else:
        file_watchers_after_update(self)
        transaction.on_commit(lambda: file_watchers_after_commit_update(self))



"""
